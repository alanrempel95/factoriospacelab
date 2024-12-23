function dragForce(velocity, width) {
  // From C:\Program Files (x86)\Steam\steamapps\common\Factorio\data\core\prototypes\utility-constants.lua, lines 509-517, version 2.0.28
  var cd; //---
  var Fd; //MN
  // -- drag_coefficient = width * 0.5
  //  -- drag = ((1500 * speed * speed + 1500 * abs(speed)) * drag_coefficient + 10000) * sign(speed)
  cd = 0.5 * width
  Fd = ((1500*(velocity/60)^2+1500*(velocity/60))*cd+10000)/1000;
  return Fd;
}

function finalThrust(thrust, weight) {
  // From C:\Program Files (x86)\Steam\steamapps\common\Factorio\data\core\prototypes\utility-constants.lua, lines 509-517, version 2.0.28
  var Ft; //MN
  // -- final_thrust = thrust / (1 + weight / 10000000)
  Ft = thrust/(1+weight/10000)
  return Ft;
}

function netAcceleration(thrust, velocity, weight) {
  // From C:\Program Files (x86)\Steam\steamapps\common\Factorio\data\core\prototypes\utility-constants.lua, lines 509-517, version 2.0.28
  var Ft; //MN
  var Fd; //MN
  var acceleration; //km/s^2
  // -- acceleration = (final_thrust - drag) / weight / 60
  Ft = finalThrust(thrust, weight);
  Fd = dragForce(velocity, width);
  acceleration = (Ft-Fd)/weight*60; //UOM bug in GUI
}

function testVelocity() {
  var thrust, width, weight, time, vel;
  thrust = 204; //MN
  width = 8; //tiles
  weight = 500; //tons
  time = 10; //s
  vel = acceleratingVelocity(thrust, width, weight, time);
  return vel;
}

function maxVelocity(thrust, width, weight) {
  var Ft; //MN
  var A, B, C, D;
  Ft = finalThrust(thrust, weight);
  A = 1;
  B = 60;
  C = (10-Ft)/((5*0.5*width)/12000);
  D = (-B+Math.sqrt(B**2-4*A*C))/(2*A);
  return D;
}

function acceleratingVelocity(thrust, width, weight, time, progress = "Ignore") {
  var Ft, Va; //MN, km/s
  var A, B, C, D, E, tau;
  Ft = finalThrust(thrust, weight);
  A = 1;
  B = 60;
  C = (10-Ft)/((5*0.5*width)/12000);
  D = (-B+Math.sqrt(B**2-4*A*C))/(2*A);
  E = (-B-Math.sqrt(B**2-4*A*C))/(2*A);
  tau = 12000*weight/(5*0.5*width)/60;
  Va = D*(1-Math.E**((E-D)*time/tau))/(1-D/E*Math.E**((E-D)*time/tau));
  if(progress="Departing") {
    Va = Va + 10;
  } else if(progress="Arriving") {
    Va = Va - 10;
  }
  return Va;
}

function acceleratingPosition(thrust, width, weight, time, progress = "Ignore") {
  var Ft, Va, Xa; //MN, km/s, km
  var A, B, C, D, E, tau;
  Ft = finalThrust(thrust, weight);
  A = 1;
  B = 60;
  C = (10-Ft)/((5*0.5*width)/12000);
  D = (-B+Math.sqrt(B**2-4*A*C))/(2*A);
  E = (-B-Math.sqrt(B**2-4*A*C))/(2*A);
  tau = 12000*weight/(5*0.5*width)/60;
  Xa = tau*Math.log((D*Math.E**((D-E)*time/tau)-E)/(D-E))-D*time;
  if(progress="Departing") {
    Xa = Xa + 10*time;
  } else if(progress="Arriving") {
    Xa = Xa - 10*time;
  }
  return Xa;
}

function testDVelocity() {
  var initialVelocity, thrust, width, weight, time, Vd;
  thrust = 204; //MN
  width = 8; //tiles
  weight = 500; //tons
  time = 10 //s
  initialVelocity = maxVelocity(thrust, width, weight);
  Vd = deceleratingVelocity(initialVelocity, width, weight, time);
  return Vd;
}

function deceleratingVelocity(initialVelocity, width, weight, time, progress = "Ignore") {
  var A, B, C, D, E, Vd; //km/s
  A = -(12000*weight)/(5*0.5*width);
  B = 60;
  C = (10)/(5*0.5*width/12000);
  D = Math.sqrt(4*C-B**2);
  E = (2*initialVelocity+B)/D;
  Vd =1/2*(D*Math.tan(time*60*D/(2*A)+Math.atan(E))-B);
  if(progress="Departing") {
    Vd = Vd + 10;
  } else if(progress="Arriving") {
    Vd = Vd - 10;
  }
  return Vd;
}

function deceleratingPosition(initialPosition, initialVelocity, width, weight, time, progress = "Ignore") {
  var A, B, C, D, E, F, Xd; //km
  A = -(12000*weight)/(5*0.5*width);
  B = 60;
  C = (10)/(5*0.5*width/12000);
  D = Math.sqrt(4*C-B**2);
  E = (2*initialVelocity+B)/D;
  F = 60*D/(2*A);
  Xd = initialPosition - A/60*Math.log(Math.cos(F*time+Math.atan(E))/Math.cos(Math.atan(E))) + B/2*time;
  if(progress="Departing") {
    Xd = Xd + 10*time;
  } else if(progress="Arriving") {
    Xd = Xd - 10*time;
  }
  return Xd;
}

function decelerationTime(initialVelocity, width, weight) {
  var A, B, C, D, E, F, td; //s
  A = -(12000*weight)/(5*0.5*width);
  B = 60;
  C = (10)/(5*0.5*width/12000);
  D = Math.sqrt(4*C-B**2);
  E = (2*initialVelocity+B)/D;
  F = 60*D/(2*A);
  td = (Math.atan(-B/D)-Math.atan(E))/F;
  return td;
}

function accelerationTime(deltaPosition, initialVelocity, thrust, width, weight) {
  //returns time (s) from transiting deltaPosition (km) using ITP method, from https://en.wikipedia.org/wiki/ITP_method#The_algorithm
  var a, b, tol, k1, k2, n0, n1_2, n_max, j, y_a, y_b, x1_2, r, del, x_f, sig, x_t, x_itp, y_itp, time;
  
  //Inputs:
  a = 0; //s, lower bound
  b = 1000; //s, upperbound
  tol = 0.1; //s, tolerance/epsilon
  k1 = 1; //peturbation constant - adjust?
  k2 = 1; //peturbation constant - adjust?
  n0 = 0; //slack variable - adjust?
  
  //Preprocessing
  n1_2 = Math.log2((b-a)/(2*tol));
  n_max = n1_2 + n0; //maximum iterations
  j = 0; //counter
  y_a = (acceleratingPosition(thrust, width, weight, a)-deltaPosition);
  y_b = (acceleratingPosition(thrust, width, weight, b)-deltaPosition);

  while (b-a>2*tol) {
    //Calculating Parameters
    x1_2 = (a+b)/2;
    r = tol*2**(n_max-j)-(b-a)/2;
    del = k1*(b-a)**k2;

    //Interpolation
    x_f = (y_b*a-y_a*b)/(y_b-y_a);

    //Truncation
    sig = Math.sign(x1_2-x_f);
    if(del<=Math.abs(x1_2-x_f)) {
      x_t = x_f+sig*del;
    } else {
      x_t = x1_2;
    }

    //Projection
    if(Math.abs(x_t-x1_2)<=r) {
      x_itp = x_t;
    } else {
      x_itp = x1_2-sig*r;
    }

    //Updating Interval
    y_itp = (acceleratingPosition(thrust, width, weight, x_itp)-deltaPosition);
    if(y_itp > 0) {
      b = x_itp;
      y_b = y_itp;
    } else if(y_itp < 0) {
      a = x_itp;
      y_a = y_itp;
    } else { //if it's exactly zero
      a = x_itp;
      b = x_itp;
    }
    j = j + 1;
  }
  
  //Output
  time = (a+b)/2; //s
  return time;
}

function totalThrust(thrusterCount, thrusterQuality, thrusterDuty) {
  //from C:\Program Files (x86)\Steam\steamapps\common\Factorio\data\space-age\prototypes\entity\entities.lua, lines 814-815, version 2.0.28
  //min_performance = {fluid_volume = 0.1, fluid_usage = 0.1, effectivity = 1},
  //max_performance = {fluid_volume = 0.8, fluid_usage = 2, effectivity = 0.51},
  //thrusterRatio = effectivity * fluidUsage - I got this from interpolation, but I don't see it anywhere in the code or API Docs.
  var fluidUsage, effectivity, thrusterRatio, qualityIndex, singleThrust, totalThrust, singleFluidUsage, totalFluidUsage;
  const thrustQualityArray = [100, 130, 160, 190, 250]; //doesn't match the documentation, but since thrusterRatio goes up to 102% I think this is correct
  const fluidUsageQualityArray = [60, 78, 96, 114, 132]; //pattern here is 1, 1.3 1.6, 1.9, 2.2 - doesn't end with 2.5 like almost everything else. confirm.
  const qualityArray = ["Normal","Uncommon","Rare","Epic","Legendary"];
  if(thrusterDuty<=0.1) {
    fluidUsage = 0.1;
    effectivity = 1.0;
  } else if(thrusterDuty >=0.8) {
    fluidUsage = 2.0;
    effectivity = 0.51;
  } else {
    fluidUsage = (2-0.1)/(0.8-0.1)*(thrusterDuty-0.1)+0.1;
    effectivity = (0.51-1.0)/(0.8-0.1)*(thrusterDuty-0.1)+1;
  }
  thrusterRatio = effectivity * fluidUsage;
  qualityIndex = qualityArray.indexOf(thrusterQuality);
  singleThrust = thrusterRatio * thrustQualityArray[qualityIndex];
  totalThrust = singleThrust * thrusterCount;
  singleFluidUsage = fluidUsage * fluidUsageQualityArray[qualityIndex];
  totalFluidUsage = singleFluidUsage * thrusterCount;
  return [totalThrust, totalFluidUsage];
}

function calculateConstants() {
  const shipWidth = document.getElementById("shipWidth").value;
  const shipWeight = document.getElementById("shipWeight").value;
  const routeLength = document.getElementById("routeLength").value;
  const thrusterCount = document.getElementById("thrusterCount").value;
  const thrusterQuality = document.getElementById("thrusterQuality").value;
  const thrusterDuty = document.getElementById("thrusterDuty").value / 100;
  const numberOfChartPoints = 100;
  
  var dragCoefficient, totalThrustAmount, adjustedThrust, maxSpeed, transitTime, slowdownTime;
  dragCoefficient = 0.5 * shipWidth;
  [totalThrustAmount, totalFluidUsage] = totalThrust(thrusterCount, thrusterQuality, thrusterDuty);
  adjustedThrust = finalThrust(totalThrustAmount, shipWeight);
  maxSpeed = maxVelocity(adjustedThrust, shipWidth, shipWeight);
  transitTime = accelerationTime(routeLength, 0, adjustedThrust, shipWidth, shipWeight);
  slowdownTime = decelerationTime(maxSpeed, shipWidth, shipWeight); //this may not reach zero, in which case starting speed when leaving is > 0 (not implemented 12/22/24)

  document.getElementsByTagName("td")[0].innerHTML = Math.round((maxSpeed + Number.EPSILON) * 100) / 100;
  document.getElementsByTagName("td")[1].innerHTML = Math.round((transitTime + Number.EPSILON) * 100) / 100;
  document.getElementsByTagName("td")[2].innerHTML = Math.round((slowdownTime + Number.EPSILON) * 100) / 100;
  document.getElementsByTagName("td")[3].innerHTML = Math.round((totalThrustAmount + Number.EPSILON) * 100) / 100;
  document.getElementsByTagName("td")[4].innerHTML = Math.round((adjustedThrust + Number.EPSILON) * 100) / 100;
  document.getElementsByTagName("td")[5].innerHTML = Math.round((dragCoefficient + Number.EPSILON) * 100) / 100;
  document.getElementsByTagName("td")[6].innerHTML = Math.round((totalFluidUsage + Number.EPSILON) * 100) / 100;

  t_inc = transitTime / numberOfChartPoints; //s
  t_i = 0; //s
  const xValues = []; //time, s
  const aValues = []; //acceleration, km/s^2
  const vValues = []; //velocity, km/s
  const yValues = []; //position, km
  var shipVelocity, shipPosition, shipAcceleration;
  
  for (let i=0;i<numberOfChartPoints+1; i++) {
    t_i = t_inc * i;
    xValues.push(Math.round((t_i + Number.EPSILON) * 100) / 100);
    shipPosition = acceleratingPosition(totalThrustAmount, shipWidth, shipWeight, t_i, progress = "Ignore");
    shipVelocity = acceleratingVelocity(totalThrustAmount, shipWidth, shipWeight, t_i, progress = "Ignore");
    //console.log(shipVelocity);
    shipAcceleration = netAcceleration(totalThrustAmount, shipVelocity, shipWeight);
    yValues.push(Math.round((shipPosition + Number.EPSILON) * 100) / 100);
    vValues.push(Math.round((shipVelocity + Number.EPSILON) * 100) / 100);
    aValues.push(Math.round((shipAcceleration + Number.EPSILON) * 100) / 100);
  }
  
  new Chart("accelerationChart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        fill: false,
        lineTension: 0,
        backgroundColor: "rgba(0,0,255,1.0)",
        borderColor: "rgba(0,0,255,0.1)",
        data: aValues
      }]
    },
    options: {
      legend: {display: false},
      scales: {
        yAxes: [{ticks: {min:-100, max:100}}],
      }
    }
  });

  new Chart("velocityChart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        fill: false,
        lineTension: 0,
        backgroundColor: "rgba(0,0,255,1.0)",
        borderColor: "rgba(0,0,255,0.1)",
        data: vValues
      }]
    },
    options: {
      legend: {display: false},
      scales: {
        yAxes: [{ticks: {min:0, max:500}}],
      }
    }
  });

  new Chart("positionChart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        fill: false,
        lineTension: 0,
        backgroundColor: "rgba(0,0,255,1.0)",
        borderColor: "rgba(0,0,255,0.1)",
        data: yValues
      }]
    },
    options: {
      legend: {display: false},
      scales: {
        yAxes: [{ticks: {min:0, max:20000}}],
      }
    }
  });
}
