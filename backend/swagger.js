import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task API",
      version: "1.0.0",
      description: "Task management API documentation",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
      },
    ],
  },

  // files containing annotations
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };