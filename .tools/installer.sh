#! /bin/bash
echo "Installing the Planner program on your computer ... (under /home/$USER/.planner)";
mkdir -p ~/.planner/

cp planner.AppImage $HOME/.planner/
echo '-> copied program';

mkdir -p ~/.local/share/applications/
cp "res/planner.desktop" /home/$USER/.local/share/applications/
echo Exec=/home/$USER/.planner/planner.AppImage >> /home/$USER/.local/share/applications/planner.desktop
echo '-> copied launcher';

mkdir -p ~/.local/share/icons/hicolor/256x256/apps/
cp "res/planner.png" /home/$USER/.local/share/icons/hicolor/256x256/apps/
echo '-> copied icon';

echo Instalation fihished.
