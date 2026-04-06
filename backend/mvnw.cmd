@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION
SET "DIRNAME=%~dp0"
IF "%DIRNAME%"=="" SET "DIRNAME=."
SET "MAVEN_PROJECTBASEDIR=%DIRNAME%"
REM Trailing \ before a closing " in -D... breaks CMD quoting; strip it for a safe path.
IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"
SET "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

IF NOT EXIST "%WRAPPER_JAR%" (
    ECHO Maven Wrapper JAR missing: %WRAPPER_JAR%
    EXIT /B 1
)

SET "JAVA_EXE="

REM 1) JAVA_HOME if it points to a real JDK
IF DEFINED JAVA_HOME IF EXIST "%JAVA_HOME%\bin\java.exe" (
    SET "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
    GOTO :run
)

REM 2) java on PATH
WHERE java >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    FOR /F "delims=" %%W IN ('WHERE java 2^>nul') DO (
        SET "JAVA_EXE=%%W"
        GOTO :run
    )
)

REM 3) Common Windows install locations (Temurin, Oracle-style, Microsoft)
FOR /D %%I IN ("%ProgramFiles%\Eclipse Adoptium\jdk-21*") DO (
    IF EXIST "%%I\bin\java.exe" (
        SET "JAVA_EXE=%%I\bin\java.exe"
        SET "JAVA_HOME=%%I"
        GOTO :run
    )
)
FOR /D %%I IN ("%ProgramFiles%\Java\jdk-21*") DO (
    IF EXIST "%%I\bin\java.exe" (
        SET "JAVA_EXE=%%I\bin\java.exe"
        SET "JAVA_HOME=%%I"
        GOTO :run
    )
)
FOR /D %%I IN ("%ProgramFiles%\Microsoft\jdk-21*") DO (
    IF EXIST "%%I\bin\java.exe" (
        SET "JAVA_EXE=%%I\bin\java.exe"
        SET "JAVA_HOME=%%I"
        GOTO :run
    )
)

ECHO.
ECHO  [ERROR] No Java 21+ JDK found. The backend needs Java to run.
ECHO.
ECHO  Install JDK 21, then open a NEW terminal and run this script again:
ECHO    winget install -e --id EclipseAdoptium.Temurin.21.JDK
ECHO.
ECHO  Or set JAVA_HOME to your JDK folder (the one that contains bin\java.exe).
ECHO  Download: https://adoptium.net/temurin/releases/?version=21
ECHO.
EXIT /B 1

:run
"%JAVA_EXE%" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
ENDLOCAL
