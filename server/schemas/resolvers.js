const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  
  Query: {
    
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate("books");
      }
      throw new AuthenticationError("Please log in!");
    },
  },
 
  Mutation: {
    
    loginUser: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("No profile with this email found.");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect password.");
      }

      const token = signToken(user);
     
      return { token, user };
    },

    
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      
      const token = signToken(user);

      return { token, user };
    },

    
    saveBook: async (parent, { book }, { user }) => {
      
      if (!user) throw new AuthenticationError("You need to be logged in!");

      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        {
          $addToSet: {
            savedBooks: book,
          },
        },
        { new: true, runValidators: true }
      );

      return updatedUser;
    },

    
    removeBook: async (parent, { bookId }, { user }) => {
      
      if (!user) throw new AuthenticationError("You need to be logged in!");

      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $pull: { savedBooks: { bookId: bookId } } },
        { new: true }
      );

      return updatedUser;
    },
  },
};

module.exports = resolvers;