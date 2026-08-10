import BlogController from '@/core/Http/Controllers/Admin/BlogController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/blogs' }, [
        { method: 'GET', path: '/', handler: wrap(() => BlogController, 'getBlogs') },
        { method: 'POST', path: '/', schema: schemas.blog, handler: wrap(() => BlogController, 'createBlog') },
        { method: 'GET', path: '/:id', handler: wrap(() => BlogController, 'getBlog') },
        { method: 'PUT', path: '/:id', schema: schemas.blog, handler: wrap(() => BlogController, 'updateBlog') },
        { method: 'DELETE', path: '/:id', schema: schemas.settingsUpdate, handler: wrap(() => BlogController, 'deleteBlog') },
    ]),
];
