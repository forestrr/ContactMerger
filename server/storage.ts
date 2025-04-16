import { users, type User, type InsertUser, Contact, InsertContact } from "@shared/schema";

// Extend the storage interface with methods for contacts
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Methods for contacts (not used in this application but added for completeness)
  saveContacts(contacts: InsertContact[]): Promise<Contact[]>;
  getAllContacts(): Promise<Contact[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  userCurrentId: number;
  contactCurrentId: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.userCurrentId = 1;
    this.contactCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async saveContacts(insertContacts: InsertContact[]): Promise<Contact[]> {
    const savedContacts: Contact[] = [];
    
    for (const contactData of insertContacts) {
      const id = this.contactCurrentId++;
      const contact: Contact = { ...contactData, id };
      this.contacts.set(id, contact);
      savedContacts.push(contact);
    }
    
    return savedContacts;
  }
  
  async getAllContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }
}

export const storage = new MemStorage();
