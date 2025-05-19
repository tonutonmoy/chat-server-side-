import express,{Request,Response} from 'express';
import { AuthRouters } from '../modules/Auth/auth.routes';
import { UserRouters } from '../modules/User/user.routes';
import { TodoRouters } from '../modules/TodoModule/todo.routes';
import messageRouter from '../modules/Message/message.routes';
import { notificationRoute } from '../modules/Notification/notification.routes';
import { upload } from '../utils/fileUploader';
import { uploadFile } from '../utils/uploadFile';
const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/users',
    route: UserRouters,
  },
  {
    path: '/todo',
    route: TodoRouters,
  },
  {
    path: '/messages',
    route: messageRouter,
  },
  {
    path: '/notifications',
    route: notificationRoute,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

router.post("/upload", upload.single("upload"), (req: Request, res: Response) => {

  console.log(req.file,'kdkdk')
  if (req.file) {
    const result = uploadFile(req.file);
    result.then((response) => {
      if (response.success) {
        return res.status(200).json(response);
      } else {
        return res.status(400).json(response);
      }
    });
  } else {
    return res.status(400).json({ success: false, error: "No file provided" });
  }
});




export default router;
