import getIrisControllerValue from "../lib/functions/getIrisControllerValue";



describe('getIrisControllerValue', () => {
  test('Should find controller position', () => {

    const irisValues = [
        0, 14, 33, 441, 11, 12, 55
    ]

    expect(getIrisControllerValue(0, [])).toBe(5);
  });
});


// Keep track on which way it rotates?
// Position: 11
// Rotate up: Then jump to 22
// Rotate down: Jump to 0
//
