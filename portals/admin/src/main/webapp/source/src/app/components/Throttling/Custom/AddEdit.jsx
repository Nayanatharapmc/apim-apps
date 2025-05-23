/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React, {
    useReducer, useState, Suspense, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import { useIntl, FormattedMessage } from 'react-intl';
import {
    Typography, Box, Grid, FormHelperText, Button,
} from '@mui/material';
import API from 'AppData/api';
import Alert from 'AppComponents/Shared/Alert';
import { format } from 'sql-formatter';
import { Progress } from 'AppComponents/Shared';
import ContentBase from 'AppComponents/AdminPages/Addons/ContentBase';
import { Link as RouterLink } from 'react-router-dom';
import InlineMessage from 'AppComponents/Shared/InlineMessage';
import Joi from '@hapi/joi';
import { green } from '@mui/material/colors';

import * as monaco from 'monaco-editor';
import { Editor as MonacoEditor, loader } from '@monaco-editor/react';

// load Monaco from node_modules instead of CDN
loader.config({ monaco });

const sampleSiddhiQuery = "FROM RequestStream SELECT userId, ( userId == 'admin@carbon.super' ) "
+ "AS isEligible , str:concat('admin@carbon.super','') as throttleKey "
+ 'INSERT INTO EligibilityStream; FROM EligibilityStream[isEligible==true]#throttler:timeBatch(1 min) '
+ 'SELECT throttleKey, (count(userId) >= 5) as isThrottled, expiryTimeStamp group by throttleKey '
+ 'INSERT ALL EVENTS into ResultStream;';
const formattedSampleSiddhiQuery = format(sampleSiddhiQuery, { language: 'spark' });

/**
 * Reducer
 * @param {JSON} state The second number.
 * @returns {Promise}
 */
function reducer(state, { field, value }) {
    switch (field) {
        case 'policyName':
            return { ...state, [field]: value };
        case 'description':
            return { ...state, [field]: value };
        case 'keyTemplate':
            return { ...state, [field]: value };
        case 'siddhiQuery':
            return { ...state, [field]: value };
        case 'editDetails':
            return value;
        default:
            return state;
    }
}

/**
 * Render a list
 * @returns {JSX} Header AppBar components.
 */
function AddEdit(props) {
    const {
        updateList, history,
    } = props;
    const intl = useIntl();
    const [initialState, setInitialState] = useState({
        policyName: '',
        description: '',
        keyTemplate: '',
        siddhiQuery: formattedSampleSiddhiQuery,
    });
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        policyName, description, keyTemplate, siddhiQuery,
    } = state;
    const [validationError, setValidationError] = useState([]);
    const restApi = new API();
    const { policyId } = props.match.params;
    const editMode = policyId !== 'create';

    useEffect(() => {
        if (editMode) {
            restApi.customPolicyGet(policyId).then((result) => {
                const formattedSiddhiQuery = format(result.body.siddhiQuery, { language: 'spark' });
                const editState = {
                    policyName: result.body.policyName,
                    description: result.body.description,
                    keyTemplate: result.body.keyTemplate,
                    siddhiQuery: formattedSiddhiQuery,
                };
                dispatch({ field: 'editDetails', value: editState });
            });
        }
        setInitialState({
            policyName: '',
            description: '',
            defaultLimit: {
                requestCount: '',
                timeUnit: 'min',
                unitTime: '',
                type: 'RequestCountLimit',
                dataAmount: '',
                dataUnit: 'KB',
            },
        });
    }, []);

    const onChange = (e) => {
        dispatch({ field: e.target.name, value: e.target.value });
    };

    const siddhiQueryOnChange = (newValue) => {
        dispatch({ field: 'siddhiQuery', value: newValue });
    };

    const validate = (fieldName, value) => {
        let error = '';
        let keys;
        const schema = Joi.string().regex(/^[^~!@#;:%^*()+={}|\\<>"',&$\s+]*$/);
        const validateKeyTemplates = ['$userId', '$apiContext', '$apiVersion', '$resourceKey',
            '$appTenant', '$apiTenant', '$appId', '$clientIp', '$customProperty'];
        let isWrongPattern = false;
        switch (fieldName) {
            case 'policyName':
                if (value === '') {
                    error = intl.formatMessage({
                        id: 'Throttling.Custom.Policy.policy.name.empty',
                        defaultMessage: 'Name is Empty',
                    });
                } else if (value.indexOf(' ') !== -1) {
                    error = intl.formatMessage({
                        id: 'Throttling.Custom.Policy.policy.name.space',
                        defaultMessage: 'Name contains spaces',
                    });
                } else if (value.length > 60) {
                    error = intl.formatMessage({
                        id: 'Throttling.Custom.Policy.policy.name.too.long.error.msg',
                        defaultMessage: 'Custom policy name is too long',
                    });
                } else if (schema.validate(value).error) {
                    error = intl.formatMessage({
                        id: 'Throttling.Custom.Policy.policy.name.invalid.character',
                        defaultMessage: 'Name contains one or more illegal characters',
                    });
                } else {
                    error = false;
                }
                setValidationError({ policyName: error });
                break;
            case 'keyTemplate':
                keys = value.split(':');
                isWrongPattern = keys.map((obj) => {
                    let partialIsValid = false;
                    partialIsValid = validateKeyTemplates.includes(obj);
                    if (!partialIsValid && obj.indexOf('$customProperty') !== -1) {
                        partialIsValid = true;
                    }
                    return partialIsValid;
                }).includes(false);
                if (value === '') {
                    error = (fieldName + ' is Empty');
                } else if (value.indexOf(' ') !== -1
                || isWrongPattern) {
                    error = intl.formatMessage({
                        id: 'Throttling.Custom.Policy.policy.invalid.key.template',
                        defaultMessage: 'Invalid Key Template',
                    });
                } else {
                    error = false;
                }
                setValidationError({ keyTemplate: error });
                break;
            case 'siddhiQuery':
                error = value === '' ? (fieldName + ' is Empty') : false;
                setValidationError({ siddhiQuery: error });
                break;
            default:
                break;
        }
        return error;
    };

    const getAllFormErrors = () => {
        let error = '';
        const policyNameErrors = validate('policyName', policyName);
        const keyTemplateErrors = validate('keyTemplate', keyTemplate);
        const siddhiQueryErrors = validate('siddhiQuery', siddhiQuery);
        error += policyNameErrors + keyTemplateErrors + siddhiQueryErrors;
        const errorText = error.replace('false', '');
        return errorText;
    };

    const formSaveCallback = () => {
        const formErrors = getAllFormErrors();
        if (formErrors !== '' && formErrors !== '0') {
            Alert.error(formErrors);
            return (false);
        }

        let promisedAddCustomPolicy;
        if (state.siddhiQuery.indexOf('\n') !== -1) {
            const siddhiQueryValue = state.siddhiQuery.split('\n').join(' ');
            delete (state.siddhiQuery);
            state.siddhiQuery = siddhiQueryValue;
        }
        const customPolicy = state;

        if (editMode) {
            promisedAddCustomPolicy = restApi.updateCustomPolicy(policyId,
                customPolicy);
            return promisedAddCustomPolicy
                .then(() => {
                    Alert.success(
                        intl.formatMessage({
                            id: 'Throttling.Custom.Policy.policy.edit.success',
                            defaultMessage: 'Custom Policy edited successfully',
                        }),
                    );
                    history.push('/throttling/custom');
                })
                .catch((error) => {
                    const { response } = error;
                    if (response.body) {
                        Alert.error(response.body.description);
                    }
                    return null;
                })
                .finally(() => {
                    if (updateList) {
                        updateList();
                    }
                });
        } else {
            promisedAddCustomPolicy = restApi.addCustomPolicy(
                customPolicy,
            );
            return promisedAddCustomPolicy
                .then(() => {
                    Alert.success(
                        intl.formatMessage({
                            id: 'Throttling.Custom.Policy.policy.add.success',
                            defaultMessage: 'Custom Policy added successfully.',
                        }),
                    );
                    history.push('/throttling/custom');
                })
                .catch((error) => {
                    const { response } = error;
                    if (response.body) {
                        Alert.error(response.body.description);
                    }
                    return null;
                })
                .finally(() => {
                    if (updateList) {
                        updateList();
                    }
                });
        }
    };

    return (
        <ContentBase
            pageStyle='half'
            title={editMode
                ? intl.formatMessage({
                    id: 'Throttling.Custom.AddEdit.title.edit',
                    defaultMessage: 'Custom Rate Limiting Policy - Edit',
                })
                : intl.formatMessage({
                    id: 'Throttling.Custom.AddEdit.title.add',
                    defaultMessage: 'Custom Rate Limiting Policy - Define Policy',
                })}
        >
            <Box component='div' m={2} sx={{ mb: 15 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={12} lg={12}>
                        <TextField
                            autoFocus
                            margin='dense'
                            name='policyName'
                            label={intl.formatMessage({
                                id: 'Admin.Throttling.Custom.Throttling.policy.add.field.name',
                                defaultMessage: 'Name',
                            })}
                            fullWidth
                            required
                            variant='outlined'
                            value={policyName}
                            disabled={editMode}
                            onChange={onChange}
                            InputProps={{
                                id: 'policyName',
                                onBlur: ({ target: { value } }) => {
                                    validate('policyName', value);
                                },
                            }}
                            error={validationError.policyName}
                            helperText={validationError.policyName ? validationError.policyName : (
                                <FormattedMessage
                                    id='Admin.Throttling.Custom.policy.add.policy.name'
                                    defaultMessage='Name of the throttle policy'
                                />
                            )}
                        />
                        <TextField
                            margin='dense'
                            name='description'
                            label={intl.formatMessage({
                                id: 'Admin.Throttling.Custom.Throttling.policy.add.field.description',
                                defaultMessage: 'Description',
                            })}
                            fullWidth
                            variant='outlined'
                            value={description}
                            onChange={onChange}
                            helperText={(
                                <FormattedMessage
                                    id='Admin.Throttling.Custom.policy.add.policy.description'
                                    defaultMessage='Description of the throttle policy'
                                />
                            )}
                        />
                        <TextField
                            margin='dense'
                            name='keyTemplate'
                            label={intl.formatMessage({
                                id: 'Admin.Throttling.Custom.Throttling.policy.add.field.key.template',
                                defaultMessage: 'Key Template',
                            })}
                            fullWidth
                            required
                            variant='outlined'
                            value={keyTemplate}
                            onChange={onChange}
                            InputProps={{
                                id: 'keyTemplate',
                                onBlur: ({ target: { value } }) => {
                                    validate('keyTemplate', value);
                                },
                            }}
                            error={validationError.keyTemplate}
                            helperText={validationError.keyTemplate ? validationError.keyTemplate : (
                                <FormattedMessage
                                    id='dsdds'
                                    defaultMessage={'The specific combination of attributes being checked '
                                        + 'in the policy need to be defined as the key template. Allowed values are : '
                                        + '$userId, $apiContext, $apiVersion, $resourceKey, $appTenant, $apiTenant,'
                                        + ' $appId, $clientIp, $customProperty, $customProperty.somevalue'}
                                />
                            )}
                        />
                        <FormHelperText sx={(theme) => ({ color: green[600], ml: 1, fontSize: theme.spacing(1.6) })}>
                            <FormattedMessage
                                id='Admin.Throttling.Custom.policy.add.key.template.helper.text'
                                defaultMessage='Eg: $userId:$apiContext:$apiVersion'
                            />
                        </FormHelperText>
                    </Grid>
                    <Grid item xs={12} md={12} lg={12}>
                        <Typography sx={{ mb: 1 }}>
                            <FormattedMessage
                                id='Admin.Throttling.Custom.policy.add.siddhi.query'
                                defaultMessage='Siddhi Query: '
                            />
                        </Typography>
                        {!editMode && (
                            <InlineMessage type='info' height={50} sx={{ mt: 1, mb: 2 }}>
                                <div>
                                    <Typography>
                                        <FormattedMessage
                                            id='Admin.Throttling.Custom.policy.add.siddhi.query.description'
                                            defaultMessage={'The following sample query will allow 5 requests per '
                                            + 'minute for an Admin user.'}
                                        />
                                    </Typography>
                                    <Typography>
                                        <FormattedMessage
                                            id='Admin.Throttling.Custom.policy.add.siddhi.query.key.template'
                                            defaultMessage='Key Template : $userId'
                                        />
                                    </Typography>
                                </div>
                            </InlineMessage>
                        )}
                        <Suspense fallback={<Progress />}>
                            <MonacoEditor
                                language='sql'
                                height='250px'
                                theme='vs-dark'
                                value={siddhiQuery}
                                onChange={siddhiQueryOnChange}
                            />
                        </Suspense>
                    </Grid>
                    <Box component='span' sx={{ mt: 2, mb: 2, ml: 2 }}>
                        <Button
                            sx={{ mr: 2 }}
                            variant='contained'
                            onClick={formSaveCallback}
                            disabled={validationError && validationError.length !== 0
                                && Object.values(validationError)[0] !== false}
                            data-testid='throttling-custom-save-button'
                        >
                            {!editMode && (
                                <FormattedMessage
                                    id='Throttling.Custom.AddEdit.form.add'
                                    defaultMessage='Add'
                                />
                            )}
                            {editMode && (
                                <FormattedMessage
                                    id='Throttling.Custom.AddEdit.form.edit'
                                    defaultMessage='Edit'
                                />
                            )}
                        </Button>
                        <RouterLink to='/throttling/custom'>
                            <Button variant='outlined'>
                                <FormattedMessage
                                    id='Throttling.Custom.AddEdit.form.cancel'
                                    defaultMessage='Cancel'
                                />
                            </Button>
                        </RouterLink>
                    </Box>
                </Grid>
            </Box>
        </ContentBase>
    );
}

AddEdit.propTypes = {
    updateList: PropTypes.func.isRequired,
    triggerButtonText: PropTypes.shape({}).isRequired,
    title: PropTypes.shape({}).isRequired,
    match: PropTypes.shape({
        params: PropTypes.shape({
            policyId: PropTypes.string,
        }),
    }).isRequired,
};

export default AddEdit;
