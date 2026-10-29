from pathlib import Path
import json,shutil
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
for name in ['2048','minesweeper']:
 source=root/'verification/fixtures'/name
 target=root/'resources/semag'/name
 if not target.exists():shutil.copytree(source,target)
report={};errors=[];external=[]
with sync_playwright() as p:
 browser=shutil.which('google-chrome') or shutil.which('chromium')
 assert browser,'A standard Chrome/Chromium installation is required'
 b=p.chromium.launch(executable_path=browser,headless=True,args=['--no-sandbox'])
 c=b.new_context(viewport={'width':1440,'height':900})
 def route(r):
  if r.request.url.startswith(('file:','blob:','data:')):r.continue_()
  else:external.append(r.request.url);r.abort()
 c.route('**/*',route)
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto((root/'index.html').as_uri(),wait_until='domcontentloaded')
 home=page.frame_locator('#iframe');home.locator('h1.title').wait_for()
 assert home.locator('h1.title').inner_text()=='selenite.'
 report['direct_html_open']=True
 page.locator('sidebar a[target="/projects"]').click()
 games=page.frame_locator('#iframe');games.locator('a.game').first.wait_for()
 assert games.locator('a.game').count()==427
 games.locator('#gamesearch').fill('2048');page.wait_for_timeout(200)
 tile=games.locator('#games a.game').filter(has_text='2048').first
 tile.locator('#star').click()
 assert games.locator('#starredgames a.game').count()==1
 report['favorites']=True
 page.locator('sidebar a[target="/settings"]').click()
 settings=page.frame_locator('#iframe');settings.locator('#themes').select_option('grass')
 assert settings.locator('body').get_attribute('theme')=='grass'
 page.locator('sidebar a[target="/projects"]').click()
 games=page.frame_locator('#iframe');games.locator('a.game').first.wait_for()
 assert games.locator('body').get_attribute('theme')=='grass','Theme storage must persist between separate file pages'
 assert games.locator('#starredgames a.game').count()==1,'Favorites must persist on navigation'
 report['cross_page_file_storage']=True
 games.locator('#gamesearch').fill('2048');page.wait_for_timeout(100)
 games.locator('#games a.game').filter(has_text='2048').first.click()
 loader=page.frame_locator('#iframe');game=loader.frame_locator('#gameFrame')
 game.locator('.tile').first.wait_for()
 initial=game.locator('.tile').count()
 game.locator('body').click();page.keyboard.press('ArrowLeft');page.keyboard.press('ArrowDown');page.wait_for_timeout(300)
 assert game.locator('.tile').count()>=2
 report['2048_gameplay']=True
 page.goto((root/'loader.html').as_uri()+'?title=Minesweeper&dir=minesweeper&img=cover.png&type=g',wait_until='domcontentloaded')
 flash=page.frame_locator('#gameFrame');flash.locator('ruffle-player').wait_for();page.wait_for_timeout(6000)
 report['ruffle_player']=flash.locator('ruffle-player').count()==1
 report['ruffle_metadata']=flash.locator('ruffle-player').evaluate('(p) => {try {return p.ruffle().metadata;} catch (_) {return null;}}')
 assert report['ruffle_metadata'],'The local Flash file must load into Ruffle'
 report['page_errors']=errors;report['external_requests']=external
 assert not errors,'Unexpected browser errors: '+str(errors)
 b.close()
path=root/'verification/direct-html-test.json';path.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
