// Scan publishable text without printing matching credential values.
import {execFileSync} from 'node:child_process';
import {readFileSync,statSync} from 'node:fs';
import {publicationExclusion} from './publication-policy.mjs';
const files=[...new Set(execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8'}).split('\0').filter(Boolean))];
const rules={
  personalPath:/\b[A-Za-z]:[\\/](?:Users[\\/][^\\/\s]+|PROJECT[\\/])[^\r\n]*/,
  secretToken:/\b(?:sk-[A-Za-z0-9_-]{20,}|xai-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16})\b/,
  privateKey:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  credentialUrl:/https?:\/\/[^\s/:]+:[^\s/@]+@/,
};
const findings=[];let inspected=0;
for(const file of files){
  const excluded=publicationExclusion(file);if(excluded)findings.push({file,kind:'publicationBoundary',reason:excluded});
  if(/^(?:Model_work\/|saves\/|logs\/|output\/)|^(?:AGENTS|PROJECT_STATE|SESSION_HANDOFF.*)\.md$|\.(?:sqlite3?|pem|pfx|p12|key)$|(?:^|\/)\.env(?:\.|$)/i.test(file)&&!/(?:\.env\.example|\.env\.template)$/.test(file))findings.push({file,kind:'privateFile'});
  if(!/\.(?:md|txt|json|jsonl|m?js|cjs|cpp|h|ps1|cmd|bat|toml|ya?ml|ini|xml|conf|html|css)$/i.test(file))continue;
  let text;try{if(statSync(file).size>5e6)continue;text=readFileSync(file,'utf8');}catch{continue;}
  inspected++;
  for(const [index,rawLine]of text.split(/\r?\n/).entries()){
    // JSON and JavaScript may encode a Windows separator as two backslashes.
    const line=rawLine.replace(/\\\\/g,'\\').replace(/\\\//g,'/');
    for(const [kind,pattern]of Object.entries(rules))if(pattern.test(line))findings.push({file,line:index+1,kind});
    const assigned=line.match(/\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|auth[_-]?token)\b["']?\s*[:=]\s*["']([A-Za-z0-9_+\/.=-]{24,})["']/i);
    if(assigned&&new Set(assigned[1]).size>=10)findings.push({file,line:index+1,kind:'credentialLiteral'});
  }
}
if(findings.length){for(const f of findings)console.error(`${f.file}${f.line?':'+f.line:''}: ${f.kind}`);console.error('Privacy check failed; matching values were not printed.');process.exitCode=1;}
else console.log(`PASS Publication privacy: ${inspected} text files; local notes excluded; no matching personal paths or credential formats. This does not scan Git history or binary content.`);
