'use strict';

const fs = require('fs');
const {parse} = require('./');

const test = require('tape');

// a simple freely redistributable game
test('lj65', (t) => {
  const info = parse(fs.readFileSync('roms/lj65.nes'));
  t.equal(info.prg_rom_size, 16384);
  t.equal(info.chr_rom_size, 8192);
  t.equal(info.has_chr_ram, false);
  t.equal(info.mirroring, 'horizontal');
  t.equal(info.has_battery_backed_sram, false);
  t.equal(info.has_trainer, false);
  t.equal(info.four_screen_mode, false);
  t.equal(info.mapper, 0);
  t.equal(info.is_vs_unisystem, false);
  t.equal(info.is_playchoice10, false);
  t.equal(info.is_nes2_0, false);
  t.equal(info.is_ines, true);
  t.equal(info.prg_ram_size, 0);
  t.equal(info.tv_system9_pal, 'NTSC');
  t.equal(info.reserved9, 0);
  t.equal(info.tv_system10, 0);
  t.equal(info.has_prg_ram, false);
  t.equal(info.has_bus_conflicts, false);
  t.end();
});

