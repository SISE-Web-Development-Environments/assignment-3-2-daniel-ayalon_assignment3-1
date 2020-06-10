CREATE TABLE familyRecipes(
    [recipe_id][int] not null ,
    [user_id][int] not null,
    [recipeName][varchar](300) not null,
    [aouther][varchar](300)  not null,
    [vegetarian][bit] not null ,
    [timeThatUsed][varchar](3000) not null,
    [image][varchar](1000) not null,
    [products][varchar](8000) not NULL ,
    [Instructions][varchar](8000) not null ,
    primary key (user_id,recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
)