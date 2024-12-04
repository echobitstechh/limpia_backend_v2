
export default {
  Base: '/api',
  Users: {
    Base: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
    Cleaners: {
        Base: '/cleaners',
        Register: '/register',
    },
  },
} as const;
