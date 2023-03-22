import getIrisControllerValue from "../lib/functions/getIrisControllerValue";


function getWhichControllerValueToSet() {

}


describe('getIrisControllerValue', () => {
  test('Should find controller position', () => {

    const irisValues = [
      1.600000023841858,
      1.7000000476837158,
      1.7999999523162842,
      2,
      2.200000047683716,
      2.4000000953674316,
      2.5999999046325684,
      2.799999952316284,
      3.0999999046325684,
      3.4000000953674316,
      3.700000047683716,
      4,
      4.400000095367432,
      4.800000190734863,
      5.199999809265137,
      5.599999904632568,
      6.199999809265137,
      6.800000190734863,
      7.300000190734863,
      8,
      8.699999809265137,
      9.600000381469727,
      10,
      11,
      65535]



    expect(getIrisControllerValue(0, [])).toBe(5);



  });
});


// Keep track on which way it rotates?
// Position: 11
// Rotate up: Then jump to 22
// Rotate down: Jump to 0
//
