import sys
from playwright.sync_api import sync_playwright
page,dur,out=sys.argv[1],float(sys.argv[2]),sys.argv[3]
only=[float(x) for x in sys.argv[4:]]
FPS=30
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1080,'height':1920})
    pg.goto('file:///tmp/claude-0/-home-claude/b1e7c721-e5cf-52e3-b005-96b100156fdc/scratchpad/pub/'+page);pg.wait_for_timeout(600)
    ts=only or [i/FPS for i in range(int(round(dur*FPS)))]
    for i,t in enumerate(ts):
        pg.evaluate(f"render({t})")
        pg.screenshot(path=f"{out}/t{t:.2f}.jpg" if only else f"{out}/{i:04d}.jpg",type='jpeg',quality=92)
    b.close()
