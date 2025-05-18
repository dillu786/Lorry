import { PrismaClient, BookingStatus, PaymentMode, Gender } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // First ensure we have users, drivers, vehicles, and owners to reference
  const userCount = await prisma.user.count();
  const driverCount = await prisma.driver.count();
  const vehicleCount = await prisma.vehicle.count();
  const ownerCount = await prisma.owner.count();

  // If there are no prerequisite data, create them first
  if (userCount < 5) {
    console.log('Creating sample users...');
    await createSampleUsers();
  }

  if (driverCount === 0) {
    console.log('Creating sample drivers...');
    await createSampleDrivers();
  }

  if (ownerCount === 0) {
    console.log('Creating sample owners...');
    await createSampleOwners();
  }

  if (vehicleCount === 0) {
    console.log('Creating sample vehicles...');
    await createSampleVehicles();
  }

  // Create Driver-Vehicle and Owner-Vehicle relationships
  await createDriverVehicleRelationships();
  await createOwnerVehicleRelationships();
  await createOwnerDriverRelationships();

  // Now fetch existing data to reference in bookings
  const users = await prisma.user.findMany({
    select: { Id: true }
  });

  const drivers = await prisma.driver.findMany({
    select: { Id: true }
  });

  const vehicles = await prisma.vehicle.findMany({
    select: { Id: true }
  });

  const owners = await prisma.owner.findMany({
    select: { Id: true }
  });

  console.log('Creating bookings...');
  
  // Create several bookings
  const bookingsData = [];
  
  for (let i = 0; i < 20; i++) {
    // Randomly decide if this booking has a driver assigned
    const hasDriver = Math.random() > 0.3;
    
    // Calculate a random past date within the last 30 days
    const bookingDate = faker.date.recent({ days: 30 });
    
    // Calculate StartTime as 5-20 minutes after booking time
    const startTime = new Date(bookingDate);
    startTime.setMinutes(startTime.getMinutes() + faker.number.int({ min: 5, max: 20 }));
    
    // Random booking status
    const statusOptions = Object.values(BookingStatus);
    const status = statusOptions[faker.number.int({ min: 0, max: statusOptions.length - 1 })];
    
    // Random payment mode
    const paymentOptions = Object.values(PaymentMode);
    const paymentMode = paymentOptions[faker.number.int({ min: 0, max: paymentOptions.length - 1 })];
    
    // Generate a random fare between $100 and $2000
    const fare = faker.commerce.price({ min: 100, max: 2000 });
    
    // Generate a random distance between 1 and 50 km
    const distance = faker.number.float({ min: 1, max: 50, fractionDigits: 1 }) + ' km';
    
    // Pick a random user
    const userId = users[faker.number.int({ min: 0, max: users.length - 1 })].Id;
    
    // Maybe assign a driver and vehicle
    const driverId = hasDriver 
      ? drivers[faker.number.int({ min: 0, max: drivers.length - 1 })].Id 
      : null;
    
    const vehicleId = hasDriver 
      ? vehicles[faker.number.int({ min: 0, max: vehicles.length - 1 })].Id 
      : null;
    
    const booking = {
      UserId: userId,
      PickUpLocation: faker.location.streetAddress(),
      DropLocation: faker.location.streetAddress(),
      Product: faker.helpers.arrayElement(['Standard', 'Premium', 'Pool', 'XL']),
      Distance: distance,
      Status: status,
      PaymentMode: paymentMode,
      BookingTime: bookingDate,
      DriverId: driverId,
      Fare: fare.toString(),
      VehicleId: vehicleId,
      StartTime: startTime,
      CreatedDateTime: bookingDate,
      UpdatedDateTime: bookingDate
    };
    
    bookingsData.push(booking);
  }
  
  // Insert bookings in batches
  await prisma.bookings.createMany({
    data: bookingsData,
    skipDuplicates: true,
  });
  
  // Create fare negotiations for a subset of bookings with drivers
  const createdBookings = await prisma.bookings.findMany({
    where: {
      DriverId: { not: null }
    },
    select: { Id: true, DriverId: true }
  });
  
  console.log('Creating fare negotiations...');
  
  for (const booking of createdBookings) {
    if (booking.DriverId) {
      // Get a random owner for fare negotiation
      const randomOwner = owners[faker.number.int({ min: 0, max: owners.length - 1 })];
      
      await prisma.fareNegotiation.create({
        data: {
          BookingId: booking.Id,
          DriverId: booking.DriverId,
          OwnerId: randomOwner.Id,
          NegotiatedFare: faker.commerce.price({ min: 100, max: 2000 }),
          NegotiatedTime: faker.date.recent({ days: 7 })
        }
      });
    }
  }

  console.log('Seeding completed successfully!');
}

// Helper functions to create sample data if needed
async function createSampleUsers() {
  const userData = Array(30).fill(null).map(() => ({
    Name: faker.person.fullName(),
    MobileNumber: faker.phone.number(),
    Gender: faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]),
    CreatedDate: faker.date.past(),
    LastLoggedIn: faker.date.recent()
  }));

  await prisma.user.createMany({
    data: userData,
    skipDuplicates: true,
  });
  
  // Create user wallets
  const users = await prisma.user.findMany({
    select: { Id: true }
  });
  
  const userWallets = users.map(user => ({
    UserId: user.Id,
    Amount: faker.number.int({ min: 0, max: 5000 })
  }));
  
  await prisma.userWallet.createMany({
    data: userWallets,
    skipDuplicates: true,
  });
}

async function createSampleDrivers() {
  const driverData = Array(10).fill(null).map(() => {
    const gender = faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]);
    const firstName = gender === Gender.MALE ? faker.person.firstName('male') : faker.person.firstName('female');
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    
    return {
      Name: fullName,
      Gender: gender,
      Password: faker.internet.password(),
      MobileNumber: faker.phone.number({ unique: true }),
      DOB: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      DrivingLicenceNumber: `DL${faker.string.alphanumeric(10).toUpperCase()}`,
      DrivingLicenceFrontImage: faker.image.url(),
      DrivingLicenceBackImage: faker.image.url(),
      DriverImage: faker.image.avatar(),
      Email: faker.internet.email({ firstName, lastName }),
      AdhaarCardNumber: `${faker.number.int({ min: 100000000000, max: 999999999999 })}`,
      FrontSideAdhaarImage: faker.image.url(),
      BackSideAdhaarImage: faker.image.url(),
      PanNumber: `${faker.string.alpha(5).toUpperCase()}${faker.number.int({ min: 1000, max: 9999 })}${faker.string.alpha(1).toUpperCase()}`,
      PanImage: faker.image.url(),
      LastLoggedIn: faker.date.recent(),
      CreatedDate: faker.date.past(),
      IsOnline: faker.datatype.boolean()
    };
  });

  for (const driver of driverData) {
    try {
      await prisma.driver.create({
        data: driver
      });
    } catch (error) {
      console.error(`Failed to create driver: ${error.message}`);
    }
  }
  
  // Create driver wallets
  const drivers = await prisma.driver.findMany({
    select: { Id: true }
  });
  
  const driverWallets = drivers.map(driver => ({
    DriverId: driver.Id,
    Amount: faker.number.int({ min: 0, max: 10000 }),
    LastUpdated: faker.date.recent()
  }));
  
  await prisma.driverWallet.createMany({
    data: driverWallets,
    skipDuplicates: true,
  });
}

async function createSampleOwners() {
  const ownerData = Array(5).fill(null).map(() => {
    const gender = faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]);
    const firstName = gender === Gender.MALE ? faker.person.firstName('male') : faker.person.firstName('female');
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    
    return {
      Name: fullName,
      Password: faker.internet.password(),
      MobileNumber: faker.phone.number({ unique: true }),
      DOB: faker.date.birthdate({ min: 25, max: 70, mode: 'age' }),
      Email: faker.internet.email({ firstName, lastName }),
      Gender: gender,
      AdhaarCardNumber: `${faker.number.int({ min: 100000000000, max: 999999999999 })}`,
      FrontSideAdhaarImage: faker.image.url(),
      BackSideAdhaarImage: faker.image.url(),
      PanNumber: `${faker.string.alpha(5).toUpperCase()}${faker.number.int({ min: 1000, max: 9999 })}${faker.string.alpha(1).toUpperCase()}`,
      PanImage: faker.image.url(),
      LastLoggedIn: faker.date.recent(),
      CreatedDate: faker.date.past()
    };
  });

  for (const owner of ownerData) {
    try {
      await prisma.owner.create({
        data: owner
      });
    } catch (error) {
      console.error(`Failed to create owner: ${error.message}`);
    }
  }
  
  // Create owner wallets
  const owners = await prisma.owner.findMany({
    select: { Id: true }
  });
  
  const ownerWallets = owners.map(owner => ({
    OwnerId: owner.Id,
    Amount: faker.number.int({ min: 10000, max: 50000 }),
    LastUpdated: faker.date.recent()
  }));
  
  await prisma.ownerWallet.createMany({
    data: ownerWallets,
    skipDuplicates: true,
  });
}

async function createSampleVehicles() {
  const vehicleCategories = ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Mini'];
  
  const vehicleData = Array(15).fill(null).map(() => ({
    Model: faker.vehicle.model(),
    Year: faker.date.past({ years: 10 }).getFullYear().toString(),
    Category: faker.helpers.arrayElement(vehicleCategories),
    VehicleImage: faker.image.url(),
    VehicleInsuranceImage: faker.image.url(),
    PermitImage: faker.image.url(),
    VehicleNumber: `${faker.string.alpha(2).toUpperCase()}-${faker.number.int({ min: 10, max: 99 })}-${faker.string.alpha(2).toUpperCase()}-${faker.number.int({ min: 1000, max: 9999 })}`
  }));

  await prisma.vehicle.createMany({
    data: vehicleData,
    skipDuplicates: true,
  });
}

async function createDriverVehicleRelationships() {
  const drivers = await prisma.driver.findMany({
    select: { Id: true }
  });
  
  const vehicles = await prisma.vehicle.findMany({
    select: { Id: true }
  });
  
  const driverVehicleData = [];
  
  // Assign 1-2 vehicles to each driver
  for (const driver of drivers) {
    const vehicleCount = faker.number.int({ min: 1, max: 2 });
    const selectedVehicles = faker.helpers.arrayElements(vehicles, vehicleCount);
    
    for (const vehicle of selectedVehicles) {
      driverVehicleData.push({
        DriverId: driver.Id,
        VehicleId: vehicle.Id
      });
    }
  }
  
  // Skip any duplicates that might occur
  await prisma.driverVehicle.createMany({
    data: driverVehicleData,
    skipDuplicates: true,
  });
}

async function createOwnerVehicleRelationships() {
  const owners = await prisma.owner.findMany({
    select: { Id: true }
  });
  
  const vehicles = await prisma.vehicle.findMany({
    select: { Id: true }
  });
  
  const ownerVehicleData = [];
  
  // Assign 2-5 vehicles to each owner
  for (const owner of owners) {
    const vehicleCount = faker.number.int({ min: 2, max: 5 });
    const selectedVehicles = faker.helpers.arrayElements(vehicles, vehicleCount);
    
    for (const vehicle of selectedVehicles) {
      ownerVehicleData.push({
        OwnerId: owner.Id,
        VehicleId: vehicle.Id
      });
    }
  }
  
  // Skip any duplicates that might occur
  await prisma.ownerVehicle.createMany({
    data: ownerVehicleData,
    skipDuplicates: true,
  });
}

async function createOwnerDriverRelationships() {
  const owners = await prisma.owner.findMany({
    select: { Id: true }
  });
  
  const drivers = await prisma.driver.findMany({
    select: { Id: true }
  });
  
  const ownerDriverData = [];
  
  // Assign 1-3 drivers to each owner
  for (const owner of owners) {
    const driverCount = faker.number.int({ min: 1, max: 3 });
    const selectedDrivers = faker.helpers.arrayElements(drivers, driverCount);
    
    for (const driver of selectedDrivers) {
      ownerDriverData.push({
        OwnerId: owner.Id,
        DriverId: driver.Id
      });
    }
  }
  
  // Skip any duplicates that might occur
  await prisma.ownerDriver.createMany({
    data: ownerDriverData,
    skipDuplicates: true,
  });
}

createSampleUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });