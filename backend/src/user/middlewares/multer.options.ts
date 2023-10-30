import { BadRequestException } from '@nestjs/common';
import { User } from '@prisma/client';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const uploadDirectory = './uploads';
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

export const multerAvatarOptions = {
  storage: diskStorage({
    destination: uploadDirectory,
    filename: (req, file, cb) => {
      const user = req.user as User;
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uniqueSuffix}-${user.id}${fileExtension}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 1000000,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(
        new BadRequestException('Only JPG, PNG and GIF files are allowed'),
        false,
      );
    }
    return cb(null, true);
  },
};
