/*//Allows to build a schema that can be pased by graphql
const { buildSchema } = require('graphql')

//Note the use of back-ticks

//Type is used to define a Query as well as what such queries return, the ':' is used to set the object type returned.
//The ! makes the field required
//In a schema, the query is set, all the queries to be used are defined ij the schema.

//Queries are the part where data is got, queries are the objects with all the queries that will be allowed.

//This is the order- Schema- Queries- Types- Subqueries.
//Note the use of ':' and ','
module.exports = buildSchema(`
    type TestData {
        text: String!
        views : Int!

    }
    type RootQuery{
        hello: TestData
    }
    schema {
        query: RootQuery

    }
`)

*/
const { buildSchema } = require('graphql')

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!

    }
    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status : String!
        posts: [Post!]!
    }
    input UserInputData {
        email: String!
        name: String!
        password : String!
    }    
    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }
    type RootMutation {
        createUser(userInput: UserInputData): User
        createPost(postInput: PostInputData) : Post

    }
  
    
    type AuthData{
        token: String!
        userId: String!
    }
    type PostData{
        posts: [Post!]!
        totalPosts: Int!
    }
    type RootQuery {
        login(email: String!, password: String!): AuthData!
        posts: PostData!
    }
    schema {
        query: RootQuery
     
        mutation: RootMutation
    }
`)

//Mutation is differerent fom query

//Mutation s used to post data essentially, maube to the database