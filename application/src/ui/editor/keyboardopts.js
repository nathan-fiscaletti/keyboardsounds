const keyboardOptions = {
    syncInstanceInputs: true,
    mergeDisplay: true,
    layout: {
        default: [
            "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
            "` 1 2 3 4 5 6 7 8 9 0 - = {backspace}",
            "{tab} q w e r t y u i o p [ ] {backslash}",
            "{capslock} a s d f g h j k l ; ' {enter}",
            "{shiftleft} z x c v b n m , . / {shiftright}",
            "{controlleft} {altleft} {metaleft} {space} {metaright} {altright} {controlright}"
        ],
        shift: [
            "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
            "~ ! @ # $ % ^ & * ( ) _ + {backspace}",
            "{tab} Q W E R T Y U I O P { } |",
            '{capslock} A S D F G H J K L : " {enter}',
            "{shiftleft} Z X C V B N M < > ? {shiftright}",
            "{controlleft} {altleft} {metaleft} {space} {metaright} {altright} {controlright}"
        ]
    },
    display: {
        "{f1}": "f1",
        "{f2}": "f2",
        "{f3}": "f3",
        "{f4}": "f4",
        "{f5}": "f5",
        "{f6}": "f6",
        "{f7}": "f7",
        "{f8}": "f8",
        "{f9}": "f9",
        "{f10}": "f10",
        "{f11}": "f11",
        "{f12}": "f12",
        "{escape}": "esc",
        "{tab}": "tab",
        "{space}": "space",
        "{backspace}": "backspace",
        "{enter}": "enter",
        "{backslash}": "\\",
        "{capslock}": "caps",
        "{shiftleft}": "shift",
        "{shiftright}": "shift",
        "{controlleft}": "ctrl",
        "{controlright}": "ctrl",
        "{altleft}": "alt",
        "{altright}": "alt",
        "{metaleft}": "cmd",
        "{metaright}": "cmd"
    },
    buttonTheme: [],
};

const keyboardControlPadOptions = {
    syncInstanceInputs: true,
    mergeDisplay: true,
    layout: {
        default: [
            "{prtscr} {scrolllock} {pause}",
            "{insert} {home} {pageup}",
            "{delete} {end} {pagedown}"
        ]
    },
    display: {
        "{prtscr}": "prt",
        "{scrolllock}": "scrl",
        "{pause}": "ps",
        "{insert}": "ins",
        "{home}": "home",
        "{pageup}": "pgu",
        "{delete}": "del",
        "{end}": "end",
        "{pagedown}": "pgd"
    },
    buttonTheme: [],
};

const keyboardArrowsOptions = {
    syncInstanceInputs: true,
    mergeDisplay: true,
    buttonTheme: [],
    layout: {
        default: ["{arrowup}", "{arrowleft} {arrowdown} {arrowright}"]
    }
};

const keyboardNumPadOptions = {
    syncInstanceInputs: true,
    mergeDisplay: true,
    buttonTheme: [],
    layout: {
        default: [
            "{numlock} {numpaddivide} {numpadmultiply}",
            "{numpad7} {numpad8} {numpad9}",
            "{numpad4} {numpad5} {numpad6}",
            "{numpad1} {numpad2} {numpad3}",
            "{numpad0} {numpaddecimal}"
        ]
    }
};

const keyboardNumPadEndOptions = {
    syncInstanceInputs: true,
    mergeDisplay: true,
    buttonTheme: [],
    layout: {
        default: ["{numpadsubtract}", "{numpadadd}", "{numpadenter}"]
    },
    display: {
        "{numpadsubtract}": "-",
        "{numpadadd}": "+",
        "{numpadenter}": "↵",
    }
};

const keyToName = {
    "{altleft}": "alt_l",
    "{altright}": "alt_r",
    "{ctrlleft}": "ctrl_l",
    "{ctrlright}": "ctrl_r",
    "{shiftleft}": "shift_l",
    "{shiftright}": "shift_r",
    "{metaleft}": "cmd_l",
    "{metaright}": "cmd_r",
    "{space}": "space",
    "{tab}": "tab",
    "{backspace}": "backspace",
    "{enter}": "enter",
    "{backslash}": "\\",
    "{capslock}": "caps_lock",
    "{shiftleft}": "shift_l",
    "{shiftright}": "shift_r",
    "{controlleft}": "ctrl_l",
    "{controlright}": "ctrl_r",
    "{altleft}": "alt_l",
    "{altright}": "alt_r",
    "{metaleft}": "cmd_l",
    "{metaright}": "cmd_r",
    "{f1}": "f1",
    "{f2}": "f2",
    "{f3}": "f3",
    "{f4}": "f4",
    "{f5}": "f5",
    "{f6}": "f6",
    "{f7}": "f7",
    "{f8}": "f8",
    "{f9}": "f9",
    "{f10}": "f10",
    "{f11}": "f11",
    "{f12}": "f12",
    "{arrowup}": "up",
    "{arrowdown}": "down",
    "{arrowleft}": "left",
    "{arrowright}": "right",
    "{prtscr}": "print_screen",
    "{scrolllock}": "scroll_lock",
    "{pause}": "pause",
    "{insert}": "insert",
    "{home}": "home",
    "{pageup}": "page_up",
    "{delete}": "delete",
    "{end}": "end",
    "{pagedown}": "page_down",
    "{numlock}": "num_lock",
    "{numpaddivide}": "\\",
    "{numpadmultiply}": "*",
    "{numpad7}": "7",
    "{numpad8}": "8",
    "{numpad9}": "9",
    "{numpad4}": "4",
    "{numpad5}": "5",
    "{numpad6}": "6",
    "{numpad1}": "1",
    "{numpad2}": "2",
    "{numpad3}": "3",
    "{numpad0}": "0",
    "{numpaddecimal}": ".",
    "{numpadsubtract}": "-",
    "{numpadadd}": "+",
    "{numpadenter}": "enter",
};

export {
    keyboardOptions,
    keyboardControlPadOptions,
    keyboardArrowsOptions,
    keyboardNumPadOptions,
    keyboardNumPadEndOptions,
    keyToName,
};