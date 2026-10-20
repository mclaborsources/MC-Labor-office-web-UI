import { strict as assert } from "node:assert";
import { test } from "node:test";
import { customerNoteText } from "./customerNoteText";

test("Access rich text renders paragraphs and spaces as readable notes", () => {
  assert.equal(customerNoteText('<div>&nbsp;MAINE 2022 - HOTEL = $50 / NIGHT PER DIEM&nbsp;&nbsp;NO HOTEL = $100 / NIGHT PER DIEM</div><div>&nbsp;</div><div>Chester Solar Project<br>George Nunn&nbsp;508&nbsp;825&nbsp;4469</div>'),
    'MAINE 2022 - HOTEL = $50 / NIGHT PER DIEM  NO HOTEL = $100 / NIGHT PER DIEM\n\nChester Solar Project\nGeorge Nunn 508 825 4469');
});
test("plain text and encoded text remain text", () => {
  assert.equal(customerNoteText('Call office\nUse gate 2'), 'Call office\nUse gate 2');
  assert.equal(customerNoteText('&lt;gate&gt; &amp; &#65; &#x42;'), '<gate> & A B');
});
