import { config } from "dotenv";
config();

import { db } from "../db";
import { users, desserts, agents, suppliers } from "../db/schema";
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
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
      },
      {
        name: "Chocolate Banana Pudding",
        description: "Banana pudding dengan chocolate ganache",
        price: "30.00",
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
      },
      {
        name: "Strawberry Banana Pudding",
        description: "Banana pudding dengan fresh strawberries",
        price: "28.00",
        imageUrl: "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=400",
      },
      {
        name: "Tiramisu",
        description: "Classic Italian tiramisu dengan coffee-soaked ladyfingers",
        price: "35.00",
        imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
      },
    ]);
  } else {
    console.log("Desserts already exist, skipping dessert seeding...");
  }

  const existingAgents = await db.select().from(agents);
  
  if (existingAgents.length === 0) {
    await db.insert(agents).values([
      {
        name: "Agent Demo",
        phone: "0198765432",
        email: "agent@demo.com",
        address: "Kuala Lumpur",
        notes: "Agent contoh",
      },
    ]);
    console.log("Agents seeded: 1 item");
  } else {
    console.log("Agents already exist, skipping...");
  }

  const existingSuppliers = await db.select().from(suppliers);
  
  if (existingSuppliers.length === 0) {
    await db.insert(suppliers).values([
      {
        name: "Supplier Demo",
        phone: "0134567890",
        email: "supplier@demo.com",
        address: "Shah Alam",
        notes: "Supplier contoh",
      },
    ]);
    console.log("Suppliers seeded: 1 item");
  } else {
    console.log("Suppliers already exist, skipping...");
  }

  console.log("Database seeded successfully!");
}

seed().catch(console.error);
