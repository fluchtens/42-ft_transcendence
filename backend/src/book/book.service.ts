import { PrismaService } from "src/prisma.service";
import { Book } from "./book.model";

export class BookService{
  constructor(private prisma: PrismaService){}

  async getAllbook(): Promise<Book[]>{
    return this.prisma.book.findMany()
  }

  async getBook(id:number): Promise<Book | null>{
    return this.prisma.book.findUnique({where: {id:Number(id)}})
  }

  async createBook(data: Book): Promise<Book>{
    return this.prisma.book.create({
      data,
    })
  }

  
}