export function reportText(source:string,data:Record<string,string|number|boolean|null>,customerIsGC=false):string{
 if(!source.startsWith('='))return String(data[source]??'');
 let expression=source.slice(1).replace(/IIf\(\[Forms\]!\[frmNoticeOfIdentification\]!\[chkCustomerIsGC\]=True,"you have",\[CustomerFullAddress\] & " as subcontractor has"\)/g,customerIsGC?'"you have"':JSON.stringify(String(data.CustomerFullAddress??'')+' as subcontractor has'));
 expression=expression.replace(/\[Page\]|\[Pages\]/g,'"1"');
 const tokens=expression.match(/"(?:""|[^"])*"|\[[^\]]+\]|&|\s+/g)??[];
 if(tokens.join('')!==expression)throw new Error('Unsupported Access report expression: '+source);
 return tokens.filter(t=>t.trim()&&t!=='&').map(token=>token.startsWith('"')?token.slice(1,-1).replace(/""/g,'"'):String(data[token.slice(1,-1)]??'')).join('');
}
