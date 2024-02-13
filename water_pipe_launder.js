
function setup() {
  createCanvas(800, 900);
}

function draw() {
  // inputs
  var flow_rate = Number(document.getElementById("fr").value);
  var internal_diameter = Number(document.getElementById("id").value);
  var wall_thickness = Number(document.getElementById("wt").value);
  var wall_roughness = Number(document.getElementById("wr").value);
  var segment_length = Number(document.getElementById("sl").value);
  var elevation_drop = Number(document.getElementById("ed").value);
  var water_temperature = Number(document.getElementById("te").value);
  var bend_radius = Number(document.getElementById("br").value);
  // calculations
  var water_density = Water('density', water_temperature)
  var water_viscosity = Water('viscosity', water_temperature)
  var slope = abs(elevation_drop / segment_length)
  var velocity = pipe_launder_water(internal_diameter, flow_rate, slope, water_viscosity, water_density, wall_roughness, '2')
  var fluid_height = pipe_launder_water(internal_diameter, flow_rate, slope, water_viscosity, water_density, wall_roughness, '5')
  var y_over_d = fluid_height / internal_diameter
  var beta = pipe_launder_water(internal_diameter, flow_rate, slope, water_viscosity, water_density, wall_roughness, '7')
  var percent_filled = pipe_launder_water(internal_diameter, flow_rate, slope, water_viscosity, water_density, wall_roughness, '3')
  if (beta > 3.13) {
    var hydraulic_depth = "full pipe flow"
  } else {
    var hydraulic_depth = 1 / 8 * (2 * beta - sin(2 * beta)) / (sin(beta)) * internal_diameter
  };
  var froude = velocity / (hydraulic_depth * 9.81) ** 0.5;
  var equivalent_diameter = pipe_launder_water(internal_diameter, flow_rate, slope, water_viscosity, water_density, wall_roughness, '6')
  var bend_width = internal_diameter;
  var bend_radius = bend_width * bend_radius;
  var n = bend_radius / bend_width;
  var superelevation_height = velocity ** 2 / (9.81 * n);
  var fluid_height_bend = fluid_height + superelevation_height;
  var y_over_d_bend = fluid_height_bend / internal_diameter;
  // output pipe image
  background('whitesmoke');
  var center_x = width / 2
  var center_y = (height + 190) / 2
  var internal_diameter_draw = internal_diameter * 1000
  stroke('black');
  fill('black');
  circle(center_x, center_y, internal_diameter_draw + wall_thickness);
  fill('whitesmoke');
  circle(center_x, center_y, internal_diameter_draw);

  // output water fill
  var start_radians = (PI - (2 * beta)) / 2
  var end_radians = start_radians + (2 * beta)
  fill('blue');
  arc(center_x, center_y, internal_diameter_draw, internal_diameter_draw, start_radians, end_radians);
  if (2 * beta < PI) {
    strokeWeight(2)
    stroke('whitesmoke');
    fill('whitesmoke');
  } else {
    strokeWeight(2)
    stroke('blue');
    fill('blue');
  }
  var right_x = center_x + internal_diameter_draw / 2.06 * cos(start_radians)
  var right_y = center_y + internal_diameter_draw / 2.06 * sin(start_radians)
  var left_x = center_x - internal_diameter_draw / 2.06 * cos(start_radians)
  var left_y = center_y + internal_diameter_draw / 2.06 * sin(start_radians)
  triangle(center_x, center_y, right_x, right_y, left_x, left_y);
  // output text
  fill('black');
  noStroke()
  textFont('Courier New')
  textSize(16);
  var x_location = 20
  var y_location = 20
  var y_spacing = 20
  text('Slope (%):               ' + (100 * slope).toPrecision(3), x_location, y_location);
  y_location = y_location + y_spacing
  text('Velocity (m/s):          ' + velocity.toPrecision(3), x_location, y_location);
  y_location = y_location + y_spacing
  text('Fluid height (m):        ' + fluid_height.toPrecision(3), x_location, y_location);
  y_location = y_location + y_spacing
  text('Fluid height / Dia. (%): ' + (100 * y_over_d).toPrecision(3) + '%', x_location, y_location);
  y_location = y_location + y_spacing
  text('Beta (-):                ' + beta.toPrecision(3), x_location, y_location);
  y_location = y_location + y_spacing
  text('Percent filled (%):      ' + (100 * percent_filled).toPrecision(3) + '%', x_location, y_location);
  y_location = y_location + y_spacing
  if (hydraulic_depth == 'full pipe flow') {
    fill('red');
    text('Hydraulic depth (m):     ' + hydraulic_depth, x_location, y_location);
    fill('black');
  } else {
    text('Hydraulic depth (m):     ' + hydraulic_depth.toPrecision(4), x_location, y_location);
  }
  y_location = y_location + y_spacing
  text('Froude number (-):       ' + froude.toPrecision(4), x_location, y_location);
  y_location = y_location + y_spacing
  text('Equivalent diameter (m): ' + equivalent_diameter.toPrecision(3), x_location, y_location);
  y_location = y_location + y_spacing
  x_location = 375
  y_location = 20
  text('Bend width (m):                 ' + bend_width.toPrecision(3), x_location, y_location);
  y_location = y_location + y_spacing
  text('Bend radius (m):                ' + bend_radius.toPrecision(3), x_location, y_location);
  y_location = y_location + y_spacing
  text('Bend superelevation height (m): ' + superelevation_height.toPrecision(3), x_location, y_location);
  y_location = y_location + y_spacing
  text('Bend fluid height (m):          ' + fluid_height_bend.toPrecision(3), x_location, y_location);
  y_location = y_location + y_spacing
  text('Bend fluid height / Dia. (%):   ' + (100 * y_over_d_bend).toPrecision(3) + '%', x_location, y_location);
  text('lee.goudzwaard@patersoncooke.com', 5, height - 5);
}

function pipe_launder_water(diameter, flow, slope, viscosity, density, roughness, output) {
  var high = PI;
  var low = 0;
  var count = 1;
  var diff = 1;
  // calculate the gravity Portion
  var dPdL_gravity = density * 9.81 * slope;
  if (dPdL_gravity == 0) {
    return 0;
  } else {
    while (diff > 0.1) {
      // set beta to mid point
      var beta = (high + low) / 2;
      // equivalent area
      var a_eq = 0.5 * (diameter / 2) ** 2 * (2 * beta - sin(2 * beta));
      var per = beta * diameter;
      var d_eq = 4 * a_eq / per;
      // velocity
      var v = (flow / 3600) / a_eq;
      // friction loss
      var re = density * v * d_eq / viscosity;
      var a = (2.457 * log(((7 / re) ** 0.9 + (0.27 * roughness / diameter)) ** -1)) ** 16;
      var b = (37530 / re) ** 16;
      var f = 2 * ((8 / re) ** 12 + (a + b) ** -1.5) ** 0.0833;
      var dPdL_fric = (2 * density * f * v ** 2 / d_eq);
      // set low or high to beta
      if (dPdL_fric > dPdL_gravity) {
        low = beta;
      } else {
        high = beta;
      }
      // calculate difference
      diff = abs(dPdL_fric - dPdL_gravity);
      count = count + 1;
      if (beta > 3.13) {
        var value = "full pipe flow";
        diff = 0;
      }
      if (count >= 100) {
        var value = "function did not converge";
        diff = 0;
      }
    }
  }
  if (output == '1') {
    var value = dPdL_fric; // pressure gradient
  } else if (output == '2') {
    var value = v; // velocity (flow / a_eq)
  } else if (output == '3') {
    var percent_filled = a_eq / (diameter ** 2 / 4 * PI); // percent filled
    var value = percent_filled;
  } else if (output == '5') {
    if (beta > 3.13) {
      var value = diameter; // depth
    } else {
      var value = diameter / 2 * (1 - cos(beta)); // depth
    }
  } else if (output == '6') {
    var value = d_eq; // equivalent Hydraulic diameter
  } else if (output == '7') {
    var value = beta; // beta
  } else {
    var value = 'incorrect output selected';
  }
  return value;
}

function Water(property, temperature) {
  const WaterArray = [
    [0, 999.9, 0.001792],
    [5, 1000, 0.001519],
    [10, 999.7, 0.001308],
    [15, 999.1, 0.00114],
    [20, 998.2, 0.001005],
    [25, 997.1, 0.000894],
    [30, 995.7, 0.000801],
    [35, 994.1, 0.000723],
    [40, 992.2, 0.000656],
    [45, 990.2, 0.000599],
    [50, 988.1, 0.000549],
    [55, 985.7, 0.000506],
    [60, 983.2, 0.000469],
    [65, 980.6, 0.000436],
    [70, 977.8, 0.000406],
    [75, 974.9, 0.00038],
    [80, 971.8, 0.000357],
    [85, 968.6, 0.000336],
    [90, 965.9, 0.000317],
    [95, 961.9, 0.000299],
    [100, 958.4, 0.000284]
  ];
  if (property == 'density') {
    var j = 1;
  } else if (property == 'viscosity') {
    var j = 2;
  } else {
    var j = 0;
  };
  if (temperature > 95) {
    temperature = 95;
  };
  if (temperature < 0) {
    temperature = 0;
  };
  for (var i = 0; i < WaterArray.length; i++) {
    if ((temperature >= WaterArray[i][0]) && (temperature < WaterArray[i + 1][0])) {
      var low = i;
      var high = i + 1;
      break;
    }
  }
  var x1 = WaterArray[low][0];
  var x2 = WaterArray[high][0];
  var y1 = WaterArray[low][j];
  var y2 = WaterArray[high][j];
  var value = (temperature - x1) / (x2 - x1) * (y2 - y1) + y1;
  return value;
}
