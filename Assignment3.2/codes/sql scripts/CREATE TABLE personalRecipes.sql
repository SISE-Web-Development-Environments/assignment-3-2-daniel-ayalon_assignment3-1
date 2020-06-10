CREATE TABLE personalRecipes(
    [recipe_id][int] not null ,
    [user_id][int] not null,
    [author] [varchar](30) NOT NULL,
    [recipe_name] [varchar](300) NOT NULL,
    [durationTime][integer] NOT NULL ,
    [image][varchar](300) NOT NULL ,

    [vegetarian][bit] NOT NULL ,
    [gluten][bit] NOT NULL ,
    [vegan][bit] NOT NULL ,
    primary key (user_id,recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),

)