#!/usr/bin/env python3
"""Create a ZIP64 offline package and optionally upload release parts with gh."""
from pathlib import Path
import argparse,hashlib,json,os,subprocess,time,zipfile
ROOT=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--release');parser.add_argument('--repository');parser.add_argument('--output',default=str(ROOT/'build'));args=parser.parse_args()
out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
zip_path=out/'selenite-offline.zip'
files=sorted(p for p in ROOT.rglob('*') if p.is_file() and p.relative_to(ROOT).parts[0] not in ['.git','.github','build'] and not p.is_relative_to(out) and '__pycache__' not in p.parts)
last=time.monotonic();done=0;total=sum(p.stat().st_size for p in files)
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=1,allowZip64=True) as z:
 for p in files:
  z.write(p,'selenite-offline/'+str(p.relative_to(ROOT)));done+=p.stat().st_size
  if time.monotonic()-last>30:print('Packed',round(done/total*100,1),'percent',flush=True);last=time.monotonic()
with zipfile.ZipFile(zip_path) as z:
 assert z.testzip() is None,'ZIP CRC verification failed'
digest=hashlib.file_digest(zip_path.open('rb'),'sha256').hexdigest()
checksums=[digest+'  selenite-offline.zip']
print('Verified ZIP:',zip_path.stat().st_size,'bytes;',len(files),'files;',digest,flush=True)
if args.release:
 assert args.repository,'--repository is required for uploads'
 target=os.environ.get('GITHUB_SHA') or subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()
 subprocess.run(['gh','release','create',args.release,'--repo',args.repository,'--target',target,'--draft','--title','Selenite offline adaptation','--notes-file',str(ROOT/'RELEASE-NOTES.md')],check=True)
 names=[]
 with zip_path.open('rb') as archive:
  part_number=0
  while True:
   start=archive.read(8*1024*1024)
   if not start:break
   part_number+=1;name=f'selenite-offline.zip.{part_number:03d}';part=out/name;remaining=1_800_000_000-len(start);h=hashlib.sha256();h.update(start)
   with part.open('wb') as f:
    f.write(start)
    while remaining:
     b=archive.read(min(8*1024*1024,remaining))
     if not b:break
     f.write(b);h.update(b);remaining-=len(b)
   checksums.append(h.hexdigest()+'  '+name);names.append(name)
   subprocess.run(['gh','release','upload',args.release,str(part),'--repo',args.repository],check=True)
   part.unlink();print('Uploaded',name,flush=True)
 sha=out/'SHA256SUMS';sha.write_text('\n'.join(checksums)+'\n')
 subprocess.run(['gh','release','upload',args.release,str(sha),str(ROOT/'READ-ME-FIRST.md'),'--repo',args.repository],check=True)
 subprocess.run(['gh','release','edit',args.release,'--repo',args.repository,'--draft=false','--latest'],check=True)
 print('Published:',args.release,'parts:',names,flush=True)
else:(out/'SHA256SUMS').write_text('\n'.join(checksums)+'\n')
