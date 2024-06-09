# FROM --platform=linux/amd64 node:lts-alpine

# WORKDIR /server

# COPY package.json ./

# RUN npm install

# RUN npm install && npm install -g nodemon

# # Set environment variables
# ENV NODE_ENV=production \
#     PORT=80 \
#     TOKEN_KEY="Secret 123" \
#     REACT_APP_BACKEND_URL="http://api.pool-ms.com" \
#     DATABASE_URL="sqlite:///./db.sqlite" \
#     JWT_SECRET="sljfsdjfouwouwrnwlrn3qw9eqeqeqlrnlncoj2330937r969qwe" \
#     SESSION_SECRET="khkhk489498309dskhf0" \
#     SALT=10 \
#     ADMIN_USERNAME="mark" \
#     ADMIN_PASSWORD="123456" \
#     ADMIN_FIRST_NAME="Mark" \
#     ADMIN_LAST_NAME="Ofosu" \
#     ADMIN_EMAIL="mark@admin" \
#     ADMIN_DATE_OF_BIRTH="1990-01-01" \
#     ADMIN_ADDRESS="New City 12"

# # Copy the rest of the application
# COPY . .

# CMD ["npm", "run", "start"]

# EXPOSE 80



FROM --platform=linux/amd64 node:lts-alpine

WORKDIR /server

COPY package.json package-lock.json ./

RUN npm install && npm install -g nodemon

# Set environment variables
ENV NODE_ENV=production \
    PORT=80 \
    TOKEN_KEY="Secret 123" \
    REACT_APP_BACKEND_URL="http://api.pool-ms.com" \
    DATABASE_URL="sqlite:///./db.sqlite" \
    JWT_SECRET="sljfsdjfouwouwrnwlrn3qw9eqeqeqlrnlncoj2330937r969qwe" \
    SESSION_SECRET="khkhk489498309dskhf0" \
    SALT=10 \
    ADMIN_USERNAME="mark" \
    ADMIN_PASSWORD="123456" \
    ADMIN_FIRST_NAME="Mark" \
    ADMIN_LAST_NAME="Ofosu" \
    ADMIN_EMAIL="mark@admin" \
    ADMIN_DATE_OF_BIRTH="1990-01-01" \
    ADMIN_ADDRESS="New City 12"

# Copy the rest of the application
COPY . .

EXPOSE 80

CMD ["npm", "run", "start"]
