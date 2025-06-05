import { PrismaClient, Gender, PaymentMode, BookingStatus, VehicleType } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create test users
  const users = [
    {
      MobileNumber: '9876543210',
      Name: 'John Doe',
      Password: await bcrypt.hash('password123', 10),
      DOB: new Date('1990-01-15'),
      Email: 'john@example.com',
      Gender: Gender.MALE,
      Latitude: 12.9716,
      Longitude: 77.5946,
    },
    {
      MobileNumber: '9876543211',
      Name: 'Jane Smith',
      Password: await bcrypt.hash('password123', 10),
      DOB: new Date('1992-05-20'),
      Email: 'jane@example.com',
      Gender: Gender.FEMALE,
      Latitude: 13.0827,
      Longitude: 80.2707,
    },
    {
      MobileNumber: '9876543212',
      Name: 'Mike Johnson',
      Password: await bcrypt.hash('password123', 10),
      DOB: new Date('1988-11-30'),
      Email: 'mike@example.com',
      Gender: Gender.MALE,
      Latitude: 19.0760,
      Longitude: 72.8777,
    }
  ]

  // Create users and their wallets
  const createdUsers = await Promise.all(
    users.map(async (user) => {
      const createdUser = await prisma.user.upsert({
        where: { MobileNumber: user.MobileNumber },
        update: user,
        create: user,
      })

      // Create wallet for each user
      await prisma.userWallet.upsert({
        where: { UserId: createdUser.Id },
        update: { Amount: 1000 },
        create: {
          UserId: createdUser.Id,
          Amount: 1000,
        },
      })

      return createdUser
    })
  )

  // Create test bookings
  const bookings = [
    {
      UserId: createdUsers[0].Id,
      PickUpLatitude: 12.9716,
      PickUpLongitude: 77.5946,
      DropLatitude: 13.0827,
      DropLangitude: 80.2707,
      PickUpLocation: 'MG Road, Bangalore',
      DropLocation: 'Marina Beach, Chennai',
      Product: 'Electronics',
      Distance: '350',
      VehicleType: VehicleType.MINI_TRUCK,
      Fare: '2500',
      ProductImage: 'https://example.com/electronics.jpg',
      Status: BookingStatus.Completed,
      PaymentMode: PaymentMode.ONLINE,
      StartTime: new Date('2024-03-15T10:00:00Z'),
    },
    {
      UserId: createdUsers[1].Id,
      PickUpLatitude: 19.0760,
      PickUpLongitude: 72.8777,
      DropLatitude: 19.1136,
      DropLangitude: 72.8697,
      PickUpLocation: 'Andheri, Mumbai',
      DropLocation: 'Bandra, Mumbai',
      Product: 'Furniture',
      Distance: '15',
      VehicleType: VehicleType.PICKUP_TRUCK,
      Fare: '800',
      ProductImage: 'https://example.com/furniture.jpg',
      Status: BookingStatus.Ongoing,
      PaymentMode: PaymentMode.CASH,
      StartTime: new Date('2024-03-16T14:00:00Z'),
    },
    {
      UserId: createdUsers[2].Id,
      PickUpLatitude: 13.0827,
      PickUpLongitude: 80.2707,
      DropLatitude: 13.0674,
      DropLangitude: 80.2376,
      PickUpLocation: 'T Nagar, Chennai',
      DropLocation: 'Adyar, Chennai',
      Product: 'Groceries',
      Distance: '8',
      VehicleType: VehicleType.CARGO_CAR,
      Fare: '400',
      ProductImage: 'https://example.com/groceries.jpg',
      Status: BookingStatus.Pending,
      PaymentMode: PaymentMode.ONLINE,
      StartTime: new Date('2024-03-17T09:00:00Z'),
    }
  ]

  // Create bookings
  await Promise.all(
    bookings.map((booking) =>
      prisma.bookings.upsert({
        where: {
          Id: booking.UserId, // This is just for upsert, actual ID will be auto-generated
        },
        update: booking,
        create: booking,
      })
    )
  )

  console.log('✅ User and Booking seed data created successfully')
}

main()
  .catch((err) => {
    console.error('❌ Error while seeding:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 