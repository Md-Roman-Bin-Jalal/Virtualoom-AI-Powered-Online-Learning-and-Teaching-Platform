import React from 'react';

export const WritingViewSection = ({
    writingViewMode,
    viewingAssessment,
    writingGenerationMode,
    createdWritingAssessments,
    handleOpenAssignModal,
    setViewingAssessment,
    setWritingViewMode,
    setWritingGenerationMode,
    isLoadingWritingAssessments,
    handleWritingModeChange,
    handleWritingViewClick,
    handleGenerateWritingAssessment,
    writingTopic,
    setWritingTopic,
    writingType,
    setWritingType,
    aiDifficulty,
    setAiDifficulty,
    aiTimeLimit,
    setAiTimeLimit,
    aiPointsPerQuestion,
    setAiPointsPerQuestion,
    aiNumWritingQuestions,
    setAiNumWritingQuestions,
    isGenerating,
    expiresIn,
    setExpiresIn,
    expiryUnit,
    setExpiryUnit,
    aiWritingEvalInstructions,
    setAiWritingEvalInstructions,
    errorMsg,
    setErrorMsg,
    // Manual form props
    writingQuestions,
    setWritingQuestions,
    writingQuestionText,
    setWritingQuestionText,
    writingPrompt,
    setWritingPrompt,
    writingInstructions,
    setWritingInstructions,
    writingWordLimit,
    setWritingWordLimit,
    writingPoints,
    setWritingPoints,
    writingDifficulty,
    setWritingDifficulty,
    aiWritingTitle,
    setAiWritingTitle,
}) => {
    return (
        <div>
            {/* Writing List View */}
            {writingViewMode && !viewingAssessment && !writingGenerationMode && (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h4>My Created Writing Assessments</h4>
                    {isLoadingWritingAssessments ? (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            padding: '20px' 
                        }}>
                            <p>Loading writing assessments...</p>
                        </div>
                    ) : createdWritingAssessments.length === 0 ? (
                        <div>
                            <p>You haven't created any writing assessments yet.</p>
                            <button
                                onClick={() => handleWritingModeChange('ai')}
                                style={{
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }}
                            >
                                Create New Writing Assessment
                            </button>
                        </div>
                    ) : (
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {createdWritingAssessments.map(assessment => (
                                <div 
                                    key={assessment._id} 
                                    style={{ 
                                        padding: '15px',
                                        marginBottom: '10px', 
                                        backgroundColor: '#f5f5f5', 
                                        borderRadius: '4px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <h4 style={{ margin: 0 }}>{assessment.title}</h4>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            Time Limit: {assessment.timeLimit} minutes | 
                                            Questions: {assessment.questions?.length || 0} |
                                            Type: {assessment.type === 'ai' ? 'AI Generated' : 'Manual'}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                            Created: {new Date(assessment.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleOpenAssignModal(assessment, 'writing')}
                                            style={{
                                                backgroundColor: '#4caf50',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Assign
                                        </button>
                                        <button
                                            onClick={() => setViewingAssessment(assessment)}
                                            style={{
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => {
                            setWritingViewMode(false);
                            setWritingGenerationMode('ai');
                        }}
                        style={{
                            backgroundColor: '#f0f0f0',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            marginTop: '15px',
                            cursor: 'pointer'
                        }}
                    >
                        Back to Writing Assessment Creation
                    </button>
                </div>
            )}

            {/* AI Writing Generation Form */}
            {writingGenerationMode === 'ai' && !writingViewMode && !viewingAssessment && (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={handleGenerateWritingAssessment}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Topic/Subject
                            </label>
                            <input 
                                type="text"
                                value={writingTopic}
                                onChange={(e) => setWritingTopic(e.target.value)}
                                placeholder="e.g., Climate Change, Literature Analysis"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Writing Type
                            </label>
                            <select
                                value={writingType}
                                onChange={(e) => setWritingType(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            >
                                <option value="essay">Essay</option>
                                <option value="short-answer">Short Answer</option>
                                <option value="technical-document">Technical Document</option>
                                <option value="creative-writing">Creative Writing</option>
                                <option value="analysis">Analysis</option>
                                <option value="research-paper">Research Paper</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Time Limit (minutes)
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="180"
                                value={aiTimeLimit}
                                onChange={(e) => setAiTimeLimit(parseInt(e.target.value))}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Number of Questions
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                value={aiNumWritingQuestions}
                                onChange={(e) => setAiNumWritingQuestions(parseInt(e.target.value))}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Evaluation Instructions (Optional)
                            </label>
                            <textarea
                                value={aiWritingEvalInstructions}
                                onChange={(e) => setAiWritingEvalInstructions(e.target.value)}
                                placeholder="Specific instructions for evaluating this writing assessment"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    minHeight: '80px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                type="submit"
                                disabled={isGenerating}
                                style={{
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                                    opacity: isGenerating ? 0.7 : 1
                                }}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Writing Assessment'}
                            </button>
                            <button
                                type="button"
                                onClick={handleWritingViewClick}
                                style={{
                                    backgroundColor: '#f0f0f0',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                View My Assessments
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Manual Writing Form */}
            {writingGenerationMode === 'manual' && !writingViewMode && !viewingAssessment && (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        // Handle manual form submission
                    }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Assessment Title
                            </label>
                            <input
                                type="text"
                                value={aiWritingTitle}
                                onChange={(e) => setAiWritingTitle(e.target.value)}
                                placeholder="Enter assessment title"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                                required
                            />
                        </div>

                        {/* Writing Questions Section */}
                        {writingQuestions.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4>Added Questions ({writingQuestions.length})</h4>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {writingQuestions.map((q, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                padding: '10px',
                                                marginBottom: '10px',
                                                backgroundColor: '#f5f5f5',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <h5 style={{ margin: '0 0 5px 0' }}>Question {index + 1}</h5>
                                            <p><strong>Prompt:</strong> {q.prompt}</p>
                                            <p><strong>Word Limit:</strong> {q.wordLimit}</p>
                                            <p><strong>Points:</strong> {q.points}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add New Question Form */}
                        <div style={{ 
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: '#f5f9ff',
                            borderRadius: '8px',
                            border: '1px solid #d1e3fa'
                        }}>
                            <h4>Add New Question</h4>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                    Question Text
                                </label>
                                <input
                                    type="text"
                                    value={writingQuestionText}
                                    onChange={(e) => setWritingQuestionText(e.target.value)}
                                    placeholder="Enter question text"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                    Writing Prompt
                                </label>
                                <textarea
                                    value={writingPrompt}
                                    onChange={(e) => setWritingPrompt(e.target.value)}
                                    placeholder="Enter the writing prompt"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                        minHeight: '100px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>
                                        Word Limit
                                    </label>
                                    <input
                                        type="number"
                                        value={writingWordLimit}
                                        onChange={(e) => setWritingWordLimit(parseInt(e.target.value))}
                                        min="50"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>
                                        Points
                                    </label>
                                    <input
                                        type="number"
                                        value={writingPoints}
                                        onChange={(e) => setWritingPoints(parseInt(e.target.value))}
                                        min="1"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!writingQuestionText || !writingPrompt) {
                                        setErrorMsg('Please provide both question text and prompt');
                                        return;
                                    }
                                    
                                    const newQuestion = {
                                        questionText: writingQuestionText,
                                        prompt: writingPrompt,
                                        wordLimit: writingWordLimit,
                                        points: writingPoints
                                    };
                                    
                                    setWritingQuestions([...writingQuestions, newQuestion]);
                                    setWritingQuestionText('');
                                    setWritingPrompt('');
                                    setWritingWordLimit(500);
                                    setWritingPoints(10);
                                }}
                                style={{
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '15px'
                                }}
                            >
                                Add Question
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                type="submit"
                                disabled={writingQuestions.length === 0}
                                style={{
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: writingQuestions.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: writingQuestions.length === 0 ? 0.7 : 1
                                }}
                            >
                                Create Writing Assessment
                            </button>
                            <button
                                type="button"
                                onClick={handleWritingViewClick}
                                style={{
                                    backgroundColor: '#f0f0f0',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                View My Assessments
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Individual Assessment View */}
            {viewingAssessment && (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h4>{viewingAssessment.title}</h4>
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>Time Limit:</strong> {viewingAssessment.timeLimit} minutes</p>
                        <p><strong>Type:</strong> {viewingAssessment.type === 'ai' ? 'AI Generated' : 'Manual'}</p>
                        {viewingAssessment.questions && viewingAssessment.questions.map((q, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '15px',
                                    marginBottom: '10px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '4px'
                                }}
                            >
                                <h5 style={{ marginTop: 0 }}>Question {index + 1}</h5>
                                <p><strong>Prompt:</strong> {q.prompt}</p>
                                {q.instructions && <p><strong>Instructions:</strong> {q.instructions}</p>}
                                <p><strong>Word Limit:</strong> {q.wordLimit} words</p>
                                <p><strong>Points:</strong> {q.points}</p>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setViewingAssessment(null)}
                        style={{
                            backgroundColor: '#f0f0f0',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Back to List
                    </button>
                </div>
            )}
        </div>
    );
};
