@echo off
echo ==========================================================
echo       INICIANDO OMNIBURGER POS - MODO QUIOSQUE
echo ==========================================================
echo.
echo Iniciando o servidor...
start npm run dev
echo.
echo Aguardando o servidor iniciar...
timeout /t 5 >nul
echo.
echo Abrindo Chrome com Impressao Silenciosa Ativada...
echo.
echo OBS: Certifique-se de que sua impressora padrao esta correta!
start chrome --kiosk-printing "http://localhost:5173"
echo.
echo Sistema iniciado! Pode fechar esta janela.
pause