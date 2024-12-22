function dragForce(velocity, width) {
  var cd;
  var Fd;
  cd = 0.5 * width
  Fd = ((1500*(velocity/60)^2+1500*(velocity/60))*cd+10000)/1000;
  return Fd;
}

function finalThrust(thrust, weight) {
  var Ft;
  Ft = thrust/(1+weight/10000)
  return Ft;
}

function netAcceleration(thrust, velocity, weight) {
  var Ft;
  var Fd;
  var acceleration;
  Ft = finalThrust(thrust, weight);
  Fd = dragForce(velocity, width);
  acceleration = (Ft-Fd)/weight*60;
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
  var Ft;
  var A, B, C, D;
  Ft = finalThrust(thrust, weight);
  A = 1;
  B = 60;
  C = (10-Ft)/((5*0.5*width)/12000);
  D = (-B+Math.sqrt(B**2-4*A*C))/(2*A);
  return D;
}

function acceleratingVelocity(thrust, width, weight, time, progress = "Ignore") {
  var Ft, Va;
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
  var Ft, Va;
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
  var A, B, C, D, E, Vd;
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
  var A, B, C, D, E, F, Xd;
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
  var A, B, C, D, E, F, td;
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
  //returns time (s) from transiting deltaPosition (km) using ITP method
  
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
  time = (a+b)/2;
  return time;
}
