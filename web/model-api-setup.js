// Seat-local form state. Keys are kept in this form's memory, never browser persistence.
const DEFAULT = {protocol:'chat-completions',baseUrl:'',model:'',apiKey:'',maxOutputTokens:null,contextTokens:32768,timeoutSeconds:120,tokenParameter:'max_tokens'};
const fields = {protocol:'setup-api-protocol',baseUrl:'setup-api-url',model:'setup-api-model',apiKey:'setup-api-key',contextTokens:'setup-api-context',maxOutputTokens:'setup-api-tokens',timeoutSeconds:'setup-api-timeout',tokenParameter:'setup-api-token-param'};

export function mountModelApiSetup(root, ctx) {
  const $ = id => root.querySelector('#'+id), profiles = new Map();
  let activeSeat = null, busy = false;
  let remembered = {};
  try {const stored=JSON.parse(localStorage.getItem('hex.modelApiProfiles')||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))remembered=stored;} catch {}
  root.className='setup-model-api';root.hidden=true;
  root.innerHTML=`<h4>模型 API 接入</h4><div class="setup-api-grid"><label class="field"><span>接口协议</span><select id="setup-api-protocol"><option value="chat-completions">OpenAI 兼容 · Chat Completions</option><option value="responses">OpenAI · Responses</option></select></label><label class="field"><span>模型名称</span><input id="setup-api-model" placeholder="填写服务商提供的模型 ID" maxlength="160" autocomplete="off"></label><label class="field wide"><span>API 基础地址或完整接口地址</span><input id="setup-api-url" placeholder="https://服务地址/v1" type="url" autocomplete="off" spellcheck="false"></label><label class="field wide"><span>API Key</span><input id="setup-api-key" placeholder="无鉴权服务可留空" type="password" autocomplete="off" spellcheck="false" maxlength="4096"></label></div><details><summary>请求参数</summary><div class="setup-api-grid"><label class="field"><span>输出长度（可留空）</span><input id="setup-api-tokens" type="number" min="64" placeholder="服务商默认，不额外限制"></label><label class="field"><span>压缩上下文预算 / Token</span><input id="setup-api-context" type="number" min="4096" value="32768"></label><label class="field"><span>请求超时 / 秒</span><input id="setup-api-timeout" type="number" min="10" max="300" value="120"></label><label class="field wide"><span>Chat Completions 输出上限参数</span><select id="setup-api-token-param"><option value="max_tokens">max_tokens · 常见兼容接口</option><option value="max_completion_tokens">max_completion_tokens · 部分推理模型</option></select></label></div></details><label class="setup-api-remember"><input id="setup-api-remember" type="checkbox" checked> 记住接口和模型，不保存密钥</label><p class="setup-note">密钥仅保留在内存。检查连接会发送一次 API 请求。</p><div class="setup-mcp-actions"><button id="setup-api-check" type="button" class="button-secondary">检查 API 连接</button><button id="setup-api-launch" type="button" class="button-primary">接入 API 玩家</button></div><p id="setup-api-status" role="status" aria-live="polite"></p>`;
  if(ctx.launchLabel)$('setup-api-launch').textContent=ctx.launchLabel;
  if(ctx.keepKey){
    $('setup-api-key').placeholder='留空则沿用当前密钥，填写可更换';
    const clear=document.createElement('label');clear.className='setup-api-remember wide';clear.innerHTML='<input id="setup-api-clear-key" type="checkbox"> 清除当前密钥（用于无鉴权接口）';
    $('setup-api-key').closest('label').after(clear);
    $('setup-api-clear-key').onchange=()=>{$('setup-api-key').disabled=$('setup-api-clear-key').checked;if($('setup-api-clear-key').checked)$('setup-api-key').value='';};
  }
  function capture() {
    if(activeSeat===null)return;
    const value=Object.fromEntries(Object.entries(fields).map(([key,id])=>[key,$(id).value]));
    value.maxOutputTokens=value.maxOutputTokens===''?null:Number(value.maxOutputTokens);value.contextTokens=Number(value.contextTokens);value.timeoutSeconds=Number(value.timeoutSeconds);
    profiles.set(activeSeat,value);
    const {apiKey,...publicProfile}=value;
    if($('setup-api-remember').checked)remembered[activeSeat]=publicProfile;else delete remembered[activeSeat];
    try {localStorage.setItem('hex.modelApiProfiles',JSON.stringify(remembered));} catch {}
  }
  function sync() {
    capture();const seat=ctx.seat();
    if(!Number.isInteger(seat)||!ctx.isApi(seat)){root.hidden=true;activeSeat=null;return;}
    if(activeSeat!==seat){
      activeSeat=seat;
      const saved=remembered[seat]&&typeof remembered[seat]==='object'?remembered[seat]:{};
      const initial={...saved,...(ctx.initialProfile||{})};
      // Migrate the old implicit 4096-token default on new connections. Live
      // configurations still preserve an explicitly selected provider requirement.
      if(!ctx.initialProfile&&!('contextTokens' in saved))initial.maxOutputTokens=null;
      const value=profiles.get(seat)||Object.fromEntries(Object.keys(DEFAULT).map(key=>[key,key==='apiKey'?'':initial[key]??DEFAULT[key]]));
      for(const [key,id]of Object.entries(fields))$(id).value=value[key]??DEFAULT[key]??'';
      $('setup-api-status').textContent=ctx.started?'保存后继续当前对局。':'填写接口，检查连接后接入。';
    }
    root.hidden=false;
    if(!ctx.available()){$('setup-api-status').textContent='当前后台尚未加载模型 API 功能。请保留当前对局，在下次完整启动游戏后使用；只刷新界面无法更新后台。';$('setup-api-check').disabled=true;$('setup-api-launch').disabled=true;}
    else if(!busy){$('setup-api-check').disabled=false;$('setup-api-launch').disabled=false;}
  }
  root.querySelectorAll('input,select').forEach(input=>input.addEventListener('change',capture));
  $('setup-api-model').addEventListener('change',()=>ctx.name($('setup-api-model').value));
  async function run(start) {
    if(busy)return;busy=true;$('setup-api-check').disabled=true;$('setup-api-launch').disabled=true;
    try {
      if(!ctx.available())throw Error('请在下次完整启动游戏后使用模型 API 接入。');
      capture();const seat=activeSeat;
      if(seat===null)throw Error('请先选择模型 API 席位。');
      const config={...profiles.get(seat)};
      const request={seat,provider:'api',rounds:ctx.rounds?.()??null,api:config,...(ctx.keepKey?{keepExistingKey:!$('setup-api-clear-key').checked}:{})};
      if(!config.baseUrl.trim()||!config.model.trim())throw Error('请填写接口地址和模型名称。');
      $('setup-api-status').textContent=start?'正在接入 API 玩家…':'正在检查鉴权和工具调用…';
      if(start){await ctx.prepare(seat);if(ctx.launch)await ctx.launch(request);else await ctx.api('lobby/agent/start',request);await ctx.refresh();$('setup-api-status').textContent=ctx.started?'已重新接入。':'已启动，连接就绪后开启纪元。';}
      else {await ctx.api('lobby/agent/check',request);$('setup-api-status').textContent='连接成功，模型支持工具调用。可以接入当前席位。';}
    }catch(error){$('setup-api-status').textContent=error.message;ctx.toast(error.message,true);}
    finally{busy=false;$('setup-api-check').disabled=!ctx.available();$('setup-api-launch').disabled=!ctx.available();}
  }
  $('setup-api-check').onclick=()=>run(false);$('setup-api-launch').onclick=()=>run(true);
  return {sync,capture};
}
