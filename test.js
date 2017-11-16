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

  const mapper_stats = {};
  let count = 0;
  paths.forEach((path) => {
    console.log(`Parsing ${path}`);
    const data = fs.readFileSync(path);
    const info = parse(data);

    if (info.mapper !== undefined) {
      const mapper = info.mapper + ':' + (info.submapper || 0);
      if (mapper_stats[mapper] == undefined) mapper_stats[mapper] = 0;
      mapper_stats[mapper] += 1;
    }
    count += 1;
  });
  console.log(mapper_stats);
  console.log(`Parsed ${count} files`);
  t.end();
});
