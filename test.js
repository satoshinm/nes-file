'use strict';

const fs = require('fs');
const {parseNES} = require('./');

const test = require('tape');

// a simple freely redistributable game
test('lj65', (t) => {
  const info = parseNES(fs.readFileSync('roms/lj65.nes'));
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

function walk(dir) {
  const list = fs.readdirSync(dir);
  let results = [];
  list.forEach((file) => {
    const path = dir + '/' + file;
    const stat = fs.statSync(path);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(path));
    } else {
      if (path.toLowerCase().endsWith('.nes')) {
        results.push(path);
      }
    }
  });
  return results;
}

test('all roms', (t) => {
  const dir = '../roms';
  const paths = walk(dir);

  let count = 0;
  let fail = 0;
  paths.forEach((path) => {
    console.log(`Parsing ${path}`);
    // Allow parse errors with bad dumps, or with these two dumps which have shorter CHRs than expected
    const allow_bad = !path.includes('[!]') || path.includes('Famicom Wars (J) [!].nes') || path.includes('Yoshi (U) [!].nes');
    const data = fs.readFileSync(path);

    try {
      const info = parseNES(data);
      if (info.is_unif) return; // not supported yet

      console.log(`Mapper: ${info.mapper}, PRG ROM: ${info.prg_rom_size}, CHR ROM: ${info.chr_rom_size}, trailer ${info.trailer.length}`);

      count += 1;
    } catch (e) {
      fail += 1;

      console.log(e);
      if (allow_bad) {
        console.log(e);
      } else {
        throw e;
      }
    }
  });
  console.log(`Parsed ${count} files, failed ${fail}`);
  t.end();
});
