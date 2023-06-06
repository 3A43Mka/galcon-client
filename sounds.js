const basePath = "./sounds/";

const galcon_count_slide = require("url:./sounds/galcon_count_slide.wav");
const galcon_game_start = require("url:./sounds/galcon_game_start.wav");
const galcon_lose = require("url:./sounds/galcon_lose.wav");
const galcon_menu_sound = require("url:./sounds/galcon_menu_sound.wav");
const galcon_planet_select = require("url:./sounds/galcon_planet_select.wav");
const galcon_player_joined = require("url:./sounds/galcon_player_joined.wav");
const galcon_win = require("url:./sounds/galcon_win.wav");


const sounds = {
    COUNT_SLIDE: galcon_count_slide,
    GAME_START: galcon_game_start,
    LOSE: galcon_lose,
    MENU_SOUND: galcon_menu_sound,
    PLANET_SELECT: galcon_planet_select,
    PLAYER_JOINED: galcon_player_joined,
    WIN: galcon_win,
}

export default sounds;