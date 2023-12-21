-- migrate:up

create table users (
    User_id serial primary key,
    First_name text not null,
    Last_name text not null,
    Email_address text not null unique,
    User_name text not null unique,
    hashed_password text not null
);

--Dekelete the default user after creating a new user
--The plain text password is 'Go!'
Insert into users (
User_id,
First_name,
Last_name,
Email_address,
hashed_password
) values (
1,
'admin',
'admin',
'admin@gmail.com',
'$2y$10$MGccYP5yjcmyZDCAmpelFue6c9cqoZ5ncELoa45MnPZ.CBmQZDBgG'
);



-- migrate:down

drop table users;
-- drop type User_role;
-- drop type User_status;
```




