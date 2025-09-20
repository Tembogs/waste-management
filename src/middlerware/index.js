import express from 'express';

const setUpMiddlewares = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
}

export default setUpMiddlewares;