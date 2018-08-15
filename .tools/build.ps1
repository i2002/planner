mkdir .\dist\tmp\
Copy-Item .\index.html .\dist\tmp\
Copy-Item .\break.html .\dist\tmp\
Copy-Item .\package.json .\dist\tmp\
Copy-Item -Recurse.\css .\dist\tmp\
Copy-Item -Recurse .\src .\dist\tmp\
Copy-Item -Recurse .\res .\dist\tmp\

.\node_modules\.bin\build --tasks win-x64,win-x86 .\dist\tmp\

Copy-Item .\dist\tmp\dist\*.exe .\dist\
Copy-Item .\dist\tmp\dist\*.zip .\dist\

Remove-Item -Recurse .\dist\tmp\