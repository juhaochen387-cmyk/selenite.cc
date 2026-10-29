#!/usr/bin/env python3
"""Populate the offline library from the pinned public source mirror (one-time online setup)."""
from pathlib import Path
import argparse,base64,concurrent.futures,hashlib,json,mimetypes,os,re,shutil,tarfile,urllib.request

ROOT=Path(__file__).resolve().parent.parent
COMMIT='5310d925eb6e1d6b5fec23a8b2e3cf77bc163f22'
URL=f'https://gitlab.com/skysthelimit.dev/selenite/-/archive/{COMMIT}/selenite-{COMMIT}.tar.gz'
TRACKING=re.compile(r'google(tagmanager|syndication|analytics)|doubleclick|cloudflareinsights|umami|/cdn-cgi/|adsbygoogle|sentry',re.I)
KNOWN=json.loads((ROOT/'tools/vendor-map.json').read_text())

def write(p,s):
 p.parent.mkdir(parents=True,exist_ok=True);temp=p.with_name(p.name+'.writing');temp.write_text(s,encoding='utf-8');temp.replace(p)

def get_library(source=None):
 if source:
  for group in ['semag','sppa']:
   dest=ROOT/'resources'/group
   if not dest.exists():shutil.copytree(Path(source)/group,dest,copy_function=os.link)
  return
 print('Downloading the pinned game/app library. This can take several minutes.',flush=True)
 with urllib.request.urlopen(URL,timeout=300) as response,tarfile.open(fileobj=response,mode='r|gz') as archive:
  count=0
  for member in archive:
   parts=Path(member.name).parts[1:]
   if not parts or parts[0] not in ['semag','sppa'] or not member.isfile():continue
   if any(p in ['..',''] for p in parts):raise ValueError('Unsafe archive member')
   dest=ROOT/'resources'/Path(*parts);dest.parent.mkdir(parents=True,exist_ok=True)
   with archive.extractfile(member) as inp,dest.open('wb') as out:shutil.copyfileobj(inp,out,1024*1024)
   count+=1
   if count%2000==0:print('Extracted',count,'files',flush=True)
 print('Library downloaded.',flush=True)

def relative(url,page):
 path=url[1:].split('?')[0]
 aliases={'home':'home.html','projects':'projects.html','apps':'apps.html','settings':'settings.html','bookmarklets':'bookmarklets.html','info':'info.html','u/':'offline-services.html','users':'offline-services.html','proxy':'offline-services.html'}
 path=aliases.get(path,path)
 if path.startswith(('semag/','sppa/')):path='resources/'+path
 return os.path.relpath(ROOT/path,page.parent).replace(os.sep,'/')+('?' + url.split('?',1)[1] if '?' in url else '')

def prepare():
 status=[];count=0;size_total=0
 for group,catalog in [('semag','games'),('sppa','apps')]:
  for game in json.loads((ROOT/'resources'/f'{catalog}.json').read_text()):
   directory=ROOT/'resources'/group/game['directory']
   assets=[p for p in directory.rglob('*') if p.is_file() and p.suffix.lower() not in ['.html','.htm','.js','.css','.map'] and not p.name.startswith('offline-')]
   size=sum(p.stat().st_size for p in assets);eligible=size<=20*1024*1024
   status.append({'name':game['name'],'directory':game['directory'],'entry_present':(directory/'index.html').exists(),'file_mode_data_bundle':eligible,'asset_bytes':size,'tested':False})
   if eligible:
    bundle={str(p.relative_to(ROOT)).replace(os.sep,'/'):[mimetypes.guess_type(p.name)[0] or ('application/wasm' if p.suffix=='.wasm' else 'application/octet-stream'),base64.b64encode(p.read_bytes()).decode()] for p in assets}
    write(directory/'offline-files.js','Object.assign(window.SELENITE_FILES ||= {},'+json.dumps(bundle,separators=(',',':'))+');\n')
    count+=1;size_total+=size
 print('Prepared',count,'data bundles from',size_total,'bytes',flush=True)
 for page in (ROOT/'resources').rglob('*.html'):
  s=page.read_text(errors='replace')
  s=re.sub(r'<!--\s*Google tag[^>]*-->\s*<script[\s\S]*?</script>\s*<script>[\s\S]*?</script>','',s,flags=re.I)
  s=re.sub(r'<script\b[^>]*\bsrc=[\"\']([^\"\']+)[\"\'][^>]*>[\s\S]*?</script>',lambda m:'' if TRACKING.search(m.group(1)) or (m.group(1).startswith('/js/') and m.group(1).endswith('analytics.js')) else m.group(0),s,flags=re.I)
  s=re.sub(r'<link\b[^>]*(?:fonts.googleapis|rel="manifest")[^>]*>','',s,flags=re.I)
  def attr(m):
   a,q,u=m.group(1),m.group(2),m.group(3)
   if u.startswith('/') and not u.startswith('//'):u=relative(u,page)
   elif u in KNOWN:u=os.path.relpath(ROOT/KNOWN[u],page.parent).replace(os.sep,'/')
   elif 'ruffle' in u and u.endswith('.js'):u=os.path.relpath(ROOT/'vendor/ruffle/ruffle.js',page.parent).replace(os.sep,'/')
   return a+'='+q+u+q
  s=re.sub(r'\b(src|href)\s*=\s*([\"\'])([^\"\']+)\2',attr,s,flags=re.I)
  prefix=os.path.relpath(ROOT,page.parent).replace(os.sep,'/')
  pre=f'<meta charset="utf-8"><script src="{prefix}/js/offline-data.js"></script><script src="{prefix}/js/offline-runtime.js"></script>'
  parts=page.relative_to(ROOT).parts;directory=ROOT.joinpath(*parts[:3])
  if (directory/'offline-files.js').exists():
   path=os.path.relpath(directory/'offline-files.js',page.parent).replace(os.sep,'/')
   pre+=f'<script>if(location.protocol==="file:")document.write(\'<script src="{path}"><\\/script>\');</script>'
  if 'ruffle.js' in s:
   path=os.path.relpath(ROOT/'vendor/ruffle',page.parent).replace(os.sep,'/')+'/'
   pre+=f'<script>if(location.protocol==="file:")document.write(\'<script src="{path}offline-ruffle-files.js"><\\/script>\');</script>'
   pre+='<script>window.RufflePlayer={config:{publicPath:'+json.dumps(path)+',autoplay:"on",unmuteOverlay:"hidden"}};</script>'
  if '<head' in s.lower():s=re.sub(r'(<head\b[^>]*>)',lambda m:m.group(0)+pre,s,count=1,flags=re.I)
  else:s=pre+s
  write(page,s)
 write(ROOT/'OFFLINE-STATUS.json',json.dumps(status,indent=2))
 assert all(i['entry_present'] for i in status),'Some game/app entry points are missing'
 print('All',len(status),'catalog entry points are present.',flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--source',help='Use an existing checkout of the pinned mirror');args=parser.parse_args()
 get_library(args.source);prepare()
