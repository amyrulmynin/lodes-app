import { config } from "dotenv";
config();

import { db } from "../db";
import { users, desserts } from "../db/schema";
import { hash } from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length === 0) {
    const hashedPassword = await hash("admin123", 10);

    await db.insert(users).values({
      email: "admin@lodes.com",
      password: hashedPassword,
      name: "Admin Lodes",
      role: "admin",
      phone: "0123456789",
    });

    const hashedAffiliatePassword = await hash("affiliate123", 10);

    await db.insert(users).values({
      email: "affiliate@lodes.com",
      password: hashedAffiliatePassword,
      name: "Demo Affiliate",
      role: "affiliate",
      phone: "0198765432",
    });
  } else {
    console.log("Users already exist, skipping user seeding...");
  }

  const existingDesserts = await db.select().from(desserts);
  
  if (existingDesserts.length === 0) {
    await db.insert(desserts).values([
      {
        name: "Banana Pudding Classic",
        description: "Creamy banana pudding dengan vanilla wafers dan whipped cream",
        price: "25.00",
        commissionRate: "15.00",
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
      },
      {
        name: "Chocolate Banana Pudding",
        description: "Banana pudding dengan chocolate ganache",
        price: "30.00",
        commissionRate: "15.00",
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
      },
      {
        name: "Strawberry Banana Pudding",
        description: "Banana pudding dengan fresh strawberries",
        price: "28.00",
        commissionRate: "12.00",
        imageUrl: "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=400",
      },
      {
        name: "Tiramisu",
        description: "Classic Italian tiramisu dengan coffee-soaked ladyfingers",
        price: "35.00",
        commissionRate: "20.00",
        imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
      },
    ]);
  } else {
    console.log("Desserts already exist, skipping dessert seeding...");
  }

  console.log("Database seeded successfully!");
}

seed().catch(console.error);
