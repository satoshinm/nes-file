'use strict';

const { parseNES } = require('../');

const div = document.createElement('div');
div.style.border = '2px dotted';
div.style.width = '100%';
div.style.height = '100%';
div.style.borderRadius = '7px';
div.textContent = 'Drop .nes files here';
document.body.appendChild(div);

div.addEventListener('dragover', (event) => {
  event.stopPropagation();
  event.preventDefault();
  console.log(`dragover`);
  div.style.border = '2px dashed';
}, false);

div.addEventListener('dragleave', (event) => {
  event.stopPropagation();
  event.preventDefault();
  div.style.border = '2px dotted';
  console.log(`dragleave`);
}, false);

function dumpCart(filename, buffer, cart) {
  const table = document.createElement('table');
  table.style.border = '1px solid black';

  function appendRow(headerText, dataText) {
    const row = document.createElement('tr');
    const header = document.createElement('th');
    header.textContent = headerText;
    const data = document.createElement('td');
    data.textContent = dataText;
    row.appendChild(header);
    row.appendChild(data);
    table.appendChild(row);
  }

  appendRow('File', `${filename} (${buffer.length} bytes)`);

  for (let key of Object.keys(cart)) {
    //appendRow(key, cart[key]);
    let value = cart[key];

    if (Buffer.isBuffer(value)) {
      value = `${value.length} bytes`;
    }

    appendRow(key, value);
  }

  return table;
}

div.addEventListener('drop', (event) => {
  event.stopPropagation();
  event.preventDefault();
  div.style.border = '2px dotted';

  for (let file of event.dataTransfer.files) {
    console.log(`Dropped file ${file}`);
    const reader = new FileReader();
    reader.onload = (e2) => {
      const arrayBuffer = reader.result;
      console.log(arrayBuffer);

      console.log(`Read file ${file.name}, ${arrayBuffer.byteLength} bytes`);

      const buffer = new Buffer(arrayBuffer);
      const cart = parseNES(buffer);
      console.log(cart);

      div.appendChild(dumpCart(file.name, buffer, cart));
      div.appendChild(document.createElement('br'));
    };
    reader.readAsArrayBuffer(file);
  }
}, false);
