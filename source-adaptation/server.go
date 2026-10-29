// Optional loopback-only launcher for games whose browser engines require HTTP.
package main

import (
 "flag"
 "fmt"
 "mime"
 "net"
 "net/http"
 "os"
 "os/exec"
 "path/filepath"
 "runtime"
 "strings"
)

func main() {
 noOpen := flag.Bool("no-open",false,"Do not open the browser")
 port := flag.Int("port",4173,"Local port (keep the same port to retain browser saves)")
 flag.Parse()
 executable,err:=os.Executable();if err!=nil {panic(err)}
 root:=filepath.Dir(executable)
 if _,err=os.Stat(filepath.Join(root,"index.html"));err!=nil {fmt.Println("Keep this launcher in the same folder as index.html.");return}
 listener,err:=net.Listen("tcp",fmt.Sprintf("127.0.0.1:%d",*port));if err!=nil{panic(err)}
 mime.AddExtensionType(".wasm","application/wasm")
 mime.AddExtensionType(".js","text/javascript")
 files:=http.FileServer(http.Dir(root))
 handler:=http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  w.Header().Set("Cross-Origin-Opener-Policy","same-origin")
  w.Header().Set("Cross-Origin-Embedder-Policy","require-corp")
  if strings.HasPrefix(r.URL.Path,"/api/"){w.Header().Set("Content-Type","application/json");w.WriteHeader(503);fmt.Fprint(w,`{"error":"This service requires the original online server."}`);return}
  if strings.HasPrefix(r.URL.Path,"/semag/")||strings.HasPrefix(r.URL.Path,"/sppa/"){r.URL.Path="/resources"+r.URL.Path}
  files.ServeHTTP(w,r)
 })
 url:="http://"+listener.Addr().String()+"/index.html"
 fmt.Println("Selenite offline: "+url)
 fmt.Println("Internet is not required. Keep this window open while playing. Press Ctrl+C to stop.")
 if !*noOpen {
  var cmd *exec.Cmd
  switch runtime.GOOS{case "windows":cmd=exec.Command("rundll32","url.dll,FileProtocolHandler",url);case "darwin":cmd=exec.Command("open",url);default:cmd=exec.Command("xdg-open",url)}
  _=cmd.Start()
 }
 if err=http.Serve(listener,handler);err!=nil{fmt.Println(err)}
}
