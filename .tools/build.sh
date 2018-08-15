#! /bin/bash
if [[ "$OSTYPE" == "linux-gnu" ]]; then
    mkdir dist/tmp
    cp index.html dist/tmp/
    cp break.html dist/tmp/
    cp package.json dist/tmp/
    cp -r css dist/tmp/
    cp -r src dist/tmp/
    cp -r res dist/tmp/

    ./node_modules/.bin/build --tasks linux-$2 dist/tmp/
    cd dist/tmp/dist/planner_v$1_linux-$2/
    npm install freedesktop-notifications
    cd ../

    mkdir appimage/
    echo -e "[Desktop Entry]\nName=Planner\nComment=A simple time managment app\nIcon=planner\nExec=planner\nTerminal=false\nType=Application\n" > appimage/planner.desktop
    cp planner_v$1_linux-$2/res/img/planner.png appimage

    mkdir appimage/usr/
    mkdir appimage/usr/bin
    cp -r planner_v$1_linux-$2/* appimage/usr/bin/

    mkdir appimage/usr/share/
    mkdir appimage/usr/share/applications/
    cp appimage/planner.desktop appimage/usr/share/applications/

    mkdir -p appimage/usr/share/icons/hicolor/256x256/apps/
    cp appimage/planner.png appimage/usr/share/icons/
    cd appimage/
    ln -s usr/bin/planner AppRun
    cd ..
    
    if [[ "$2" == "x64" ]]; then
        ARCH=x86_64 ../../../.tools/appimagetool-x86_64.AppImage appimage/ ../../planner_v$1_linux-$2.AppImage
    else
        ARCH=i686 ../../../.tools/appimagetool-i686.AppImage appimage/ ../../planner_v$1_linux-$2.AppImage
    fi
    cd ../../../
    rm -rf dist/tmp/

    # Create install archive
    mkdir dist/archive/
    cp dist/planner_v$1_linux-$2.AppImage dist/archive/planner.AppImage
    chmod +x dist/archive/planner.AppImage
    cp .tools/installer.sh dist/archive/
    mkdir dist/archive/res
    cp res/img/planner.png dist/archive/res
    echo -e "[Desktop Entry]\nName=Planner\nComment=A simple time managment app\nIcon=planner\nTerminal=false\nType=Application\n" > dist/archive/res/planner.desktop
    echo -e "-- Planner v$1 -- \n Repo: https://github.com/i2002/planner \n\n ## Description ##\n Simple time management app \n\n ## Instalation ## \n In this directory run 'bash installer.sh'. It will install desktop file, icon and AppImage file.\n\n ## Uninstall ##\n Remove the following files/folders:\n - ~/.planner/\n - ~/.local/share/applications/planner.desktop\n - ~/.local/share/icons/hicolor/256x256/apps/planner.png\n - ~/.config/planner/\n - ~/.cache/planner/\n" > dist/archive/README
    cp LICENCE dist/archive/LICENCE

    cd dist/archive
    tar -cf ../planner_v$1_linux-$2.tar *
    cd ../../
    rm -rf dist/archive
    echo "Created archive"

elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "mac"
    mkdir dist/tmp/
    cp index.html dist/tmp/
    cp break.html dist/tmp/
    cp package.json dist/tmp/
    cp -r css dist/tmp/
    cp -r src dist/tmp/
    cp -r res dist/tmp/

    ./node_modules/.bin/build --tasks mac-x64 dist/tmp/
    mv dist/tmp/dist/planner_v$1_mac-x64/credits.html dist/tmp/dist/planner_v$1_mac-x64/nwjs-credits.html

    rm dist/planner_v$1_mac.dmg
    hdiutil create -format UDZO -srcfolder dist/tmp/dist/planner_v$1_mac-x64/ dist/planner_v$1_mac.dmg
    rm -rf dist/tmp/
else
	echo $OSTYPE
    echo "Unsupported build platform"
fi
