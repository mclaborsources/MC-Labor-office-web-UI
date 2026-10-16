const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const original=Module._load;let calls=[];
Module._load=function(id,...args){
 if(id==='@/lib/auth/session')return {getSessionOrDefault:async()=>({isLoggedIn:true,user:{active:true,displayName:'TEST'}})};
 if(id==='@/lib/jobSiteData')return {getJobSiteData:async()=>({})};
 if(id==='@/lib/db/sql')return {clearReadCache:()=>{}};
 if(id==='@/lib/db/write')return {withTransaction:async work=>work(async(q,params)=>{calls.push({q,params});return {recordset:q.includes('WHERE SpecialJobInstruction=@name')?[]:[{ProjectID:17807,id:1}],rowsAffected:[1]};})};
 return original.call(this,id,...args);
};
const file=path.join(process.cwd(),'src/app/api/jobs/[jobId]/site/route.ts');const mod=new Module(file,module);mod.filename=file;mod.paths=module.paths;mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
async function post(body){calls=[];const result=await mod.exports.POST(new Request('http://localhost/api/jobs/17807/site',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost'},body:JSON.stringify(body)}),{params:Promise.resolve({jobId:'17807'})});return {status:result.status,body:await result.json(),calls};}
(async()=>{
 let r=await post({action:'save',fields:{SiteName:'Test name',DoNotShowOnInvoice:true}});assert.equal(r.status,200);assert.ok(r.calls.some(c=>c.q.startsWith('UPDATE tblProject')));assert.ok(r.calls.every(c=>!c.q.includes('Test name')));
 r=await post({action:'save',fields:{UnknownColumn:'oops'}});assert.equal(r.status,400);assert.ok(!r.calls.some(c=>c.q.startsWith('UPDATE')));
 r=await post({action:'save',fields:{ParentProjectID:17807}});assert.equal(r.status,200);
 r=await post({action:'save',fields:{GCVerifyMethodID:1}});assert.equal(r.status,200);assert.ok(r.calls.some(c=>c.q.includes('GCVerifyTimestamp=CASE')));assert.ok(r.calls.some(c=>c.q.startsWith('INSERT INTO tblProjectGCVerifyNotes')));
 r=await post({action:'instruction-save',name:'',text:'text'});assert.equal(r.status,400);
 r=await post({action:'party',kind:'bank',name:'Test',street:'',zip:'',cityId:null});assert.equal(r.status,200);assert.ok(r.calls.some(c=>c.q.startsWith('INSERT INTO tblProjectBMFs')));assert.ok(r.calls.some(c=>c.q.includes('SET ProjectBMFID=@link')));
 console.log('Job workflow validation: 6 checks passed; no live database writes.');
})().finally(()=>{Module._load=original;}).catch(error=>{console.error(error);process.exitCode=1;});
