const fs=require('fs');let s=fs.readFileSync('src/lib/jobLegalData.ts','utf8').replace('owing[0]?.Amount??null','owing[0]?.Amount??0');fs.writeFileSync('src/lib/jobLegalData.ts',s);
