FROM --platform=linux/amd64 node:lts-alpine

WORKDIR /server

COPY package.json package-lock.json ./

RUN npm install && npm install -g nodemon

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    TOKEN_KEY="Secret 123" \
    JWT_SECRET="sljfsdjfouwouwrnlncoj2330937r969qwe" \
    SESSION_SECRET="khkhk489498309dskhf0" \
    SALT=10 \
    ADMIN_USERNAME="mark" \
    ADMIN_PASSWORD="123456" \
    ADMIN_FIRST_NAME="Mark" \
    ADMIN_LAST_NAME="Ofosu" \
    ADMIN_EMAIL="mark@admin" \
    ADMIN_DATE_OF_BIRTH="1990-01-01" \
    ADMIN_ADDRESS="New City 12" \
    PUBLIC_USERNAME="user1" \
    PUBLIC_PASSWORD="123456" \
    PUBLIC_FIRST_NAME="John" \
    PUBLIC_LAST_NAME="Doe" \
    PUBLIC_EMAIL="johndoe@gmail.com" \
    PUBLIC_DATE_OF_BIRTH="1980-01-01" \
    PUBLIC_ADDRESS="New City 22"

# Copy the rest of the application
COPY . .

EXPOSE 5000

CMD ["npm", "run", "start"]
