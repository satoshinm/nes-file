'use strict';

// https://wiki.nesdev.com/w/index.php/INES
// https://wiki.nesdev.com/w/index.php/NES_2.0

function parseNES(buf) {
  const magic = buf.readUInt32BE(0);
  switch (magic) {
    case 0x554e4946: // UNIF
      return {is_unif: true};
      // TODO: could parse this, but format is deprecated:
      // https://wiki.nesdev.com/w/index.php/UNIF
    case 0x4e45531a: // NES^Z
      break;
    default:
      throw new Error('Not a .nes file (bad magic)');
  }

  const info = {};

  const prg_rom_16k = buf.readUInt8(4);
  info.prg_rom_size = prg_rom_16k * 16384;

  const chr_rom_8k = buf.readUInt8(5);
  info.chr_rom_size = chr_rom_8k * 8192;
  info.has_chr_ram = chr_rom_8k === 0; // "(0 indicates CHR RAM)"

  const flags6 = buf.readUInt8(6);
  info.mirroring = !!(flags6 & 1) ? 'vertical' : 'horizontal';
  info.has_battery_backed_sram = !!(flags6 & 2);
  info.has_trainer = !!(flags6 & 4);
  info.four_screen_mode = !!(flags6 & 8);
  info.mapper = flags6 >> 4;

  const flags7 = buf.readUInt8(7);
  info.is_vs_unisystem = !!(flags7 & 1);
  info.is_playchoice10 = !!(flags7 & 2);
  //info.is_nes2_0 = ((flags7 & 4) >> 2) === 2;
  info.mapper |= flags7 & 0xf0;

  // https://wiki.nesdev.com/w/index.php/INES#Variant_comparison
  // Recommended detection procedure:
  // If byte 7 AND $0C = $08, and the size taking into account byte 9 does not exceed the actual size of the ROM image, then NES 2.0.
  // If byte 7 AND $0C = $00, and bytes 12-15 are all 0, then iNES.
  // Otherwise, archaic iNES.
  info.is_nes2_0 = (flags7 & 0x0c) === 0x08;
  // TODO: also check "the size taking into account byte 9 does not exceed the actual size of the ROM image"
  info.is_ines = (flags7 & 0x0c) === 0; // TODO: also check "bytes 12-15 are all 0"
  if (!info.is_nes2_0 && !info.is_ines) {
    info.is_archaic = true;
  }

  // https://wiki.nesdev.com/w/index.php/INES#iNES_file_format says this was PRG RAM size
  // but https://wiki.nesdev.com/w/index.php/NES_2.0#Byte_8_.28Mapper_variant.29 says mapper variant
  if (!info.is_nes2_0) {
    const prg_ram_8k = buf.readUInt8(8);
    info.prg_ram_size = prg_ram_8k * 8192;

    const flags9 = buf.readUInt8(9);
    info.tv_system9_pal = !!(flags9 & 1) ? 'PAL' : 'NTSC';
    info.reserved9 = flags9 >> 1;

    const flags10 = buf.readUInt8(10);
    info.tv_system10 = (flags10 & 3);
    info.has_prg_ram = !!(flags10 & 16);
    info.has_bus_conflicts = !!(flags10 & 32);
  }
  
  // NES 2.0
  if (info.is_nes2_0) {
    const byte8 = buf.readUInt8(8);

    info.submapper = byte8 & 0x0f;
    info.mapper |= (byte8 >> 4) << 8;

    const byte9 = buf.readUInt8(9);
    info.prg_rom_size |= (byte9 & 0x0f) << 8;
    info.chr_rom_size |= ((byte9 & 0xf0 >> 4)) << 8;

    // "Bytes 10 and 11 of the header define the size of the RAM segments exponentially using 4-bit values:"
    function exponential_size(n) {
      if (n === 0) return 0;
      if (n == 15) throw new Error(`reserved value ${n} in size`);
      return 1 << (6 + n);
    }

    const byte10 = buf.readUInt8(10);
    info.prg_ram_not_battery_backed = exponential_size(byte10 & 0x0f);
    info.prg_ram_is_battery_backed = exponential_size((byte10 & 0xf0) >> 4);

    const byte11 = buf.readUInt8(11);
    info.chr_ram_not_battery_backed = exponential_size(byte11 & 0x0f);
    info.chr_ram_is_battery_backed = exponential_size((byte11 & 0xf0) >> 4);

    const byte12 = buf.readUInt8(12);
    info.tv_system = !!(byte12 & 1) ? 'PAL' : 'NTSC';
    if (byte12 & 2) info.tv_system = 'both';

    const byte13 = buf.readUInt8(13);
    info.vs_ppu = [
       'RP2C03B',
       'RP2C03G',
       'RP2C04-0001',
       'RP2C04-0002',
       'RP2C04-0003',
       'RP2C04-0004',
       'RC2C03B',
       'RC2C03C',
       'RC2C05-01',
       'RC2C05-02',
       'RC2C05-03',
       'RC2C05-04',
       'RC2C05-05',
       'not defined (13)',
       'not defined (14)',
       'not defined (15)'
    ][byte13 & 0x0f];
    info.vs_mode = (byte13 & 0xf0) >> 4;

    const byte14 = buf.readUInt8(14);
    info.extra_roms = byte14 & 3;

    const byte15 = buf.readUInt8(15);
    info.reserved15 = byte15;
  }

  info.header = buf.slice(0, 16);

  if (info.has_trainer) {
    info.trainer = buf.slice(16, 16 + 512);
  }
  const prg_start = 16 + (info.has_trainer ? 512 : 0);
  info.prg_rom = buf.slice(prg_start, prg_start + info.prg_rom_size);
  if (info.prg_rom.length !== info.prg_rom_size) {
    throw new Error(`PRG ROM bad read: ${info.prg_rom.length} != ${info.prg_rom_size}`);
  }


  const chr_start = prg_start + info.prg_rom_size;
  info.chr_rom = buf.slice(chr_start, chr_start + info.chr_rom_size);
  if (info.chr_rom.length !== info.chr_rom_size) {
    throw new Error(`CHR ROM bad read: ${info.chr_rom.length} != ${info.chr_rom_size}`);
  }

  // PlayChoice INST-ROM and/or PROM and/or 128-byte or 127-byte title
  info.trailer = buf.slice(chr_start + info.chr_rom_size);

  return info;
}

module.exports = { parseNES };
