#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <string>

int WINAPI WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
    wchar_t buffer[32768];
    GetModuleFileNameW(nullptr, buffer, 32768);
    std::wstring root(buffer);
    root = root.substr(0, root.find_last_of(L"\\/"));
    std::wstring runtime = root + L"\\tools\\electron\\electron.exe";
    std::wstring entry = root + L"\\desktop\\main.cjs";
    if (GetFileAttributesW(runtime.c_str()) == INVALID_FILE_ATTRIBUTES) {
        MessageBoxW(nullptr, L"Game runtime was not found. Keep the entire game folder together.", L"Hex Civilizations", MB_OK | MB_ICONERROR);
        return 1;
    }
    std::wstring command = L"\"" + runtime + L"\" \"" + entry + L"\"";
    STARTUPINFOW startup{};
    startup.cb = sizeof(startup);
    PROCESS_INFORMATION process{};
    if (!CreateProcessW(runtime.c_str(), command.data(), nullptr, nullptr, FALSE, 0, nullptr, root.c_str(), &startup, &process)) {
        MessageBoxW(nullptr, L"Could not start the game runtime.", L"Hex Civilizations", MB_OK | MB_ICONERROR);
        return 2;
    }
    CloseHandle(process.hThread);
    CloseHandle(process.hProcess);
    return 0;
}
