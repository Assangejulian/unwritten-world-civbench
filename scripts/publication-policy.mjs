// Shared publication boundary for source snapshots and portable distributions.
const ROOT_DOCUMENTS=new Set(['README.md','LICENSE.md','NOTICE.md','CHANGELOG.md','CONTRIBUTING.md','CODE_OF_CONDUCT.md','SECURITY.md']);
export function publicationExclusion(file,{distribution=false}={}){
  const name=String(file).replaceAll('\\','/').replace(/^\.\//,'');
  if(/^(?:Model_work|saves|logs|output|dist|coverage|test-results|playwright-report)(?:\/|$)/i.test(name))return 'local history or generated state';
  if(/^\.git(?:\/|$)/i.test(name))return 'repository history';
  if(!name.includes('/')&&/\.md$/i.test(name)&&!ROOT_DOCUMENTS.has(name)&&!(distribution&&name==='READ_THIS_FIRST.md'))return 'legacy root development or review document';
  if(/\.(?:sqlite3?|pem|pfx|p12|key)$|(?:^|\/)\.env(?:\.|$)|(?:^|\/)(?:\.npmrc|\.envrc)$/i.test(name)&&!/(?:\.env\.example|\.env\.template)$/.test(name))return 'private configuration or credentials';
  return null;
}
