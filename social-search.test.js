/**
 * Tests for debounced search functionality in Social Hub
 */

describe('Social Hub Search Debouncing', () => {
  let SocialHub;
  let mockSearchResults;

  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <input type="text" id="friendSearchInput" />
      <div id="searchResults"></div>
    `;

    // Mock SocialAPI
    global.SocialAPI = {
      searchUsers: jest.fn(),
      isLoggedIn: jest.fn(() => true),
      currentUser: { id: 'test-user', username: 'TestUser' }
    };

    // Load SocialHub
    SocialHub = {
      SEARCH_DEBOUNCE_MS: 400,
      searchDebounceTimer: null,
      searchAbortController: null,
      
      handleSearchInput(event) {
        const query = event.target.value.trim();
        const resultsEl = document.getElementById('searchResults');

        if (this.searchDebounceTimer) {
          clearTimeout(this.searchDebounceTimer);
        }

        if (this.searchAbortController) {
          this.searchAbortController.abort();
          this.searchAbortController = null;
        }

        if (query.length < 2) {
          resultsEl.innerHTML = '';
          return;
        }

        resultsEl.innerHTML = '<div class="search-loading">🔍 Searching...</div>';

        this.searchDebounceTimer = setTimeout(() => {
          this.searchPlayers(query, resultsEl);
        }, this.SEARCH_DEBOUNCE_MS);
      },

      async searchPlayers(query, resultsEl) {
        this.searchAbortController = new AbortController();

        try {
          const users = await global.SocialAPI.searchUsers(query, 10, this.searchAbortController.signal);
          
          resultsEl.innerHTML = users.length > 0 ? `
            <div class="search-results-dropdown">
              ${users.map(user => `
                <div class="search-result-item">
                  <strong>${user.username}</strong>
                </div>
              `).join('')}
            </div>
          ` : '<div class="search-no-results">No players found</div>';
        } catch (error) {
          if (error.name === 'AbortError') {
            return;
          }
          console.error('Search failed:', error);
          resultsEl.innerHTML = '<div class="search-error">Search failed. Please try again.</div>';
        }
      }
    };

    mockSearchResults = [
      { id: '1', username: 'Player1', profile: { level: 10, avatar: 'https://example.com/1.png' } },
      { id: '2', username: 'Player2', profile: { level: 20, avatar: 'https://example.com/2.png' } }
    ];
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('should not trigger search for queries less than 2 characters', () => {
    const input = document.getElementById('friendSearchInput');
    const resultsEl = document.getElementById('searchResults');

    input.value = 'a';
    SocialHub.handleSearchInput({ target: input });

    expect(resultsEl.innerHTML).toBe('');
    expect(global.SocialAPI.searchUsers).not.toHaveBeenCalled();
  });

  test('should show loading indicator immediately when typing', () => {
    const input = document.getElementById('friendSearchInput');
    const resultsEl = document.getElementById('searchResults');

    input.value = 'test';
    SocialHub.handleSearchInput({ target: input });

    expect(resultsEl.innerHTML).toContain('Searching...');
    expect(global.SocialAPI.searchUsers).not.toHaveBeenCalled();
  });

  test('should debounce search calls - only last search should execute', async () => {
    jest.useFakeTimers();
    const input = document.getElementById('friendSearchInput');

    global.SocialAPI.searchUsers.mockResolvedValue(mockSearchResults);

    // Simulate rapid typing
    input.value = 't';
    SocialHub.handleSearchInput({ target: input });
    
    jest.advanceTimersByTime(100);
    
    input.value = 'te';
    SocialHub.handleSearchInput({ target: input });
    
    jest.advanceTimersByTime(100);
    
    input.value = 'tes';
    SocialHub.handleSearchInput({ target: input });
    
    jest.advanceTimersByTime(100);
    
    input.value = 'test';
    SocialHub.handleSearchInput({ target: input });

    // Fast-forward past debounce delay
    jest.advanceTimersByTime(400);

    // Wait for async operations
    await Promise.resolve();

    // API should only be called once (for the final "test" query)
    expect(global.SocialAPI.searchUsers).toHaveBeenCalledTimes(1);
    expect(global.SocialAPI.searchUsers).toHaveBeenCalledWith('test', 10, expect.any(Object));

    jest.useRealTimers();
  });

  test('should display search results correctly', async () => {
    jest.useFakeTimers();
    const input = document.getElementById('friendSearchInput');
    const resultsEl = document.getElementById('searchResults');

    global.SocialAPI.searchUsers.mockResolvedValue(mockSearchResults);

    input.value = 'player';
    SocialHub.handleSearchInput({ target: input });

    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(resultsEl.innerHTML).toContain('Player1');
    expect(resultsEl.innerHTML).toContain('Player2');

    jest.useRealTimers();
  });

  test('should display "No players found" when search returns empty results', async () => {
    jest.useFakeTimers();
    const input = document.getElementById('friendSearchInput');
    const resultsEl = document.getElementById('searchResults');

    global.SocialAPI.searchUsers.mockResolvedValue([]);

    input.value = 'nonexistent';
    SocialHub.handleSearchInput({ target: input });

    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(resultsEl.innerHTML).toContain('No players found');

    jest.useRealTimers();
  });

  test('should handle search errors gracefully', async () => {
    jest.useFakeTimers();
    const input = document.getElementById('friendSearchInput');
    const resultsEl = document.getElementById('searchResults');

    global.SocialAPI.searchUsers.mockRejectedValue(new Error('Network error'));

    input.value = 'error';
    SocialHub.handleSearchInput({ target: input });

    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(resultsEl.innerHTML).toContain('Search failed');

    jest.useRealTimers();
  });

  test('should cancel previous requests when typing continues', async () => {
    jest.useFakeTimers();
    const input = document.getElementById('friendSearchInput');

    let abortCount = 0;
    const mockAbort = jest.fn(() => abortCount++);

    // Store original AbortController
    const OriginalAbortController = global.AbortController;
    
    // Mock AbortController
    global.AbortController = jest.fn(() => ({
      abort: mockAbort,
      signal: { aborted: false }
    }));

    global.SocialAPI.searchUsers.mockResolvedValue(mockSearchResults);

    // First search
    input.value = 'test1';
    SocialHub.handleSearchInput({ target: input });
    jest.advanceTimersByTime(400);
    await Promise.resolve();

    // Verify controller was created for first search
    const firstController = SocialHub.searchAbortController;
    expect(firstController).not.toBe(null);

    // Second search (should cancel first if it's still pending)
    input.value = 'test2';
    SocialHub.handleSearchInput({ target: input });
    
    // Verify that abort was called on the previous controller
    expect(mockAbort).toHaveBeenCalled();
    
    jest.advanceTimersByTime(400);
    await Promise.resolve();

    // Restore original AbortController
    global.AbortController = OriginalAbortController;

    jest.useRealTimers();
  });

  test('should ignore AbortError when request is cancelled', async () => {
    jest.useFakeTimers();
    const input = document.getElementById('friendSearchInput');
    const resultsEl = document.getElementById('searchResults');

    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';
    
    global.SocialAPI.searchUsers.mockRejectedValue(abortError);

    input.value = 'abort';
    SocialHub.handleSearchInput({ target: input });

    jest.advanceTimersByTime(400);
    await Promise.resolve();

    // Should not show error message for aborted requests
    expect(resultsEl.innerHTML).not.toContain('Search failed');

    jest.useRealTimers();
  });

  test('should clear results immediately when query becomes too short', () => {
    const input = document.getElementById('friendSearchInput');
    const resultsEl = document.getElementById('searchResults');

    // First set some content
    resultsEl.innerHTML = '<div>Previous results</div>';

    // Then type a short query
    input.value = 'a';
    SocialHub.handleSearchInput({ target: input });

    expect(resultsEl.innerHTML).toBe('');
  });
});
