/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import * as monaco from 'monaco-editor'
import { Editor as MonacoEditor, loader } from '@monaco-editor/react';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import PropTypes from 'prop-types';
import AsyncApiUI from './asyncApiUI/AsyncApiUI';

const PREFIX = 'AsyncApiEditorDrawer';

// load Monaco from node_modules instead of CDN
loader.config({ monaco })

const classes = {
    editorPane: `${PREFIX}-editorPane`,
    editorRoot: `${PREFIX}-editorRoot`
};


const Root = styled('div')(() => ({
    [`& .${classes.editorPane}`]: {
        width: '50%',
        height: '100%',
        overflow: 'scroll',
    },

    [`& .${classes.editorRoot}`]: {
        height: '100%',
    }
}));

/**
 * This component hosts the AsyncAPI Editor component.
 * Known Issue: The cursor jumps back to the start of the first line when updating the swagger-ui based on the
 * modification done via the editor.
 * https://github.com/wso2/product-apim/issues/5071
 * */
class AsyncApiEditorDrawer extends React.Component {
    /**
     * @inheritDoc
     */
    constructor(props) {
        super(props);
        this.onContentChange = this.onContentChange.bind(this);
    }

    /**
     * Method to handle the change event of the editor.
     * @param {string} content : The edited content.
     * */
    onContentChange(content) {
        const { onEditContent } = this.props;
        onEditContent(content);
    }

    /**
     * @inheritDoc
     */
    render() {
        const {  language, asyncAPI } = this.props;
        return (
            (<Root>
                <Grid container spacing={2} className={classes.editorRoot}>
                    <Grid item className={classes.editorPane}>
                        <MonacoEditor
                            language={language}
                            width='100%'
                            height='calc(100vh - 51px)'
                            theme='vs-dark'
                            value={asyncAPI}
                            onChange={this.onContentChange}
                            options={{ glyphMargin: true }}
                        />
                    </Grid>
                    <Grid item className={classes.editorPane}>
                        <div style={{ padding: '1%' }}>
                            <AsyncApiUI spec={asyncAPI} />
                        </div>
                    </Grid>
                </Grid>
            </Root>)
        );
    }
}

AsyncApiEditorDrawer.propTypes = {
    classes: PropTypes.shape({}).isRequired,
    language: PropTypes.string.isRequired,
    asyncAPI: PropTypes.string.isRequired,
    onEditContent: PropTypes.func.isRequired,
};

export default (AsyncApiEditorDrawer);
