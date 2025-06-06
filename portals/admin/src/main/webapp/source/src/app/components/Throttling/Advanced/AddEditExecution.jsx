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
import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import { useIntl, FormattedMessage } from 'react-intl';
import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormLabel from '@mui/material/FormLabel';

/**
 * Render the execution polcy section and default limits.
 * @returns {JSX} Returns form component.
 * @param {JSON} props Props passed from other components.
 */
function AddEditExecution(props) {
    const intl = useIntl();

    const {
        onChange, updateGroup, hasErrors, limit, validating,
    } = props;
    const { requestCount, bandwidth } = limit;
    let timeUnit = '';
    let unitTime = '';
    let limitOption = '';
    if (requestCount) {
        timeUnit = requestCount.timeUnit;
        unitTime = requestCount.unitTime;
        limitOption = 'REQUESTCOUNTLIMIT';
    } else {
        timeUnit = bandwidth.timeUnit;
        unitTime = bandwidth.unitTime;
        limitOption = 'BANDWIDTHLIMIT';
    }
    const update = (e) => {
        if (onChange) {
            const { name, value } = e.target;
            if (name === 'requestCount' || name === 'dataAmount' || name === 'unitTime') {
                if (value === '' || Number(value) >= 0) {
                    onChange(e);
                }
            } else {
                onChange(e);
            }
            return;
        }
        const field = e.target.name;
        const { value } = e.target;
        /*
        We are preping the payload for following two cases.
        ======== 1 =========
        {
            "type": "BANDWIDTHLIMIT",
            "requestCount": null,
            "bandwidth": {
            "timeUnit": "min",
            "unitTime": 1,
            "dataAmount": 1,
            "dataUnit": "KB"
            }
        }
        ======== 2 =========
        {
            "type": "REQUESTCOUNTLIMIT",
            "requestCount": {
            "timeUnit": "min",
            "unitTime": 1,
            "requestCount": 5
            },
            "bandwidth": null
        }
        */
        if (field === 'defaultLimit') {
        // Handling the radio buttons.
            if (value === 'REQUESTCOUNTLIMIT') {
                const { timeUnit: bandwidthTimeUnit, unitTime: bandwidthUnitTime } = bandwidth;
                limit.requestCount = {
                    timeUnit: bandwidthTimeUnit, unitTime: bandwidthUnitTime, requestCount: 0,
                };
                limit.bandwidth = null;
                limit.type = 'REQUESTCOUNTLIMIT';
            } else {
                const { timeUnit: requestCountTimeUnit, unitTime: requestCountUnitTime } = requestCount;
                limit.bandwidth = {
                    timeUnit: requestCountTimeUnit, unitTime: requestCountUnitTime, dataAmount: 0, dataUnit: 'KB',
                };
                limit.requestCount = null;
                limit.type = 'BANDWIDTHLIMIT';
            }
        } else if (requestCount) {
            requestCount[field] = value;
        } else {
            bandwidth[field] = value;
        }
        updateGroup();
    };
    return (
        <>
            <Box display='flex' flexDirection='row' alignItems='center'>
                <Box flex='1' sx={{ ml: 1 }}>
                    <FormLabel component='legend'>
                        <FormattedMessage
                            id='Throttling.Advanced.AddEditExecution.default.limit.option'
                            defaultMessage='Default Limit Option'
                        />
                    </FormLabel>
                </Box>
                <RadioGroup
                    aria-label='Default Limits'
                    name='defaultLimit'
                    value={limitOption}
                    onChange={update}
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <FormControlLabel
                        value='REQUESTCOUNTLIMIT'
                        control={<Radio />}
                        label={(
                            <FormattedMessage
                                id='Throttling.Advanced.AddEditExecution.default.limit.option.request.count.label'
                                defaultMessage='Request Count'
                            />
                        )}
                    />
                    <FormControlLabel
                        value='BANDWIDTHLIMIT'
                        control={<Radio />}
                        label={(
                            <FormattedMessage
                                id='Throttling.Advanced.AddEditExecution.default.limit.option.request.bandwith.label'
                                defaultMessage='Request Bandwidth'
                            />
                        )}
                    />
                </RadioGroup>
            </Box>
            <Box component='div' m={1}>
                {requestCount && (
                    <TextField
                        margin='dense'
                        name='requestCount'
                        value={requestCount.requestCount}
                        onChange={update}
                        label={(
                            <FormattedMessage
                                id='Throttling.Advanced.AddEdit.form.requestCount.label'
                                defaultMessage='Request Count'
                            />
                        )}
                        fullWidth
                        type='number'
                        error={hasErrors('requestCount', requestCount.requestCount, validating)}
                        helperText={hasErrors('requestCount', requestCount.requestCount, validating)
                            || intl.formatMessage({
                                id: 'Throttling.Advanced.AddEdit.form.request.count.allowed.help',
                                defaultMessage: 'Number of requests allowed',
                            })}
                        variant='outlined'
                    />
                )}
                {bandwidth && (
                    <Box display='flex' flexDirection='row'>
                        <TextField
                            margin='dense'
                            name='dataAmount'
                            value={bandwidth.dataAmount}
                            onChange={update}
                            type='number'
                            label={(
                                <FormattedMessage
                                    id='Throttling.Advanced.AddEdit.form.dataAmount.label'
                                    defaultMessage='Data Bandwidth'
                                />
                            )}
                            sx={{ width: 350, mr: 1 }}
                            error={hasErrors('dataAmount', bandwidth.dataAmount, validating)}
                            helperText={hasErrors('dataAmount', bandwidth.dataAmount, validating)
                            || intl.formatMessage({
                                id: 'Throttling.Advanced.AddEdit.form.bandwidth.allowed.help',
                                defaultMessage: 'Bandwidth allowed',
                            })}
                            variant='outlined'
                        />
                        <FormControl variant='outlined' sx={{ pt: 1, pl: 0.5 }}>
                            <Select
                                variant='outlined'
                                name='dataUnit'
                                value={bandwidth.dataUnit}
                                onChange={update}
                                sx={{ width: 120 }}
                            >
                                <MenuItem value='KB'>KB</MenuItem>
                                <MenuItem value='MB'>MB</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                )}
                <Box display='flex' flexDirection='row'>
                    <TextField
                        margin='dense'
                        name='unitTime'
                        value={unitTime}
                        onChange={update}
                        type='number'
                        label={(
                            <FormattedMessage
                                id='Throttling.Advanced.AddEdit.form.unit.time.label'
                                defaultMessage='Unit Time'
                            />
                        )}
                        sx={{ width: 350, mr: 1 }}
                        error={hasErrors('unitTime', unitTime, validating)}
                        helperText={hasErrors('unitTime', unitTime, validating) || intl.formatMessage({
                            id: 'Throttling.Advanced.AddEdit.form.unit.time.help',
                            defaultMessage: 'Time configuration',
                        })}
                        variant='outlined'
                    />
                    <FormControl variant='outlined' sx={{ pt: 1, pl: 0.5 }}>
                        <Select
                            variant='outlined'
                            name='timeUnit'
                            value={timeUnit}
                            onChange={update}
                            sx={{ width: 120 }}
                        >
                            <MenuItem value='min'>
                                <FormattedMessage
                                    id='Throttling.Advanced.AddEdit.form.timeUnit.minute'
                                    defaultMessage='Minute(s)'
                                />
                            </MenuItem>
                            <MenuItem value='hour'>
                                <FormattedMessage
                                    id='Throttling.Advanced.AddEdit.form.timeUnit.hour'
                                    defaultMessage='Hour(s)'
                                />
                            </MenuItem>
                            <MenuItem value='days'>
                                <FormattedMessage
                                    id='Throttling.Advanced.AddEdit.form.timeUnit.day'
                                    defaultMessage='Day(s)'
                                />
                            </MenuItem>
                            <MenuItem value='month'>
                                <FormattedMessage
                                    id='Throttling.Advanced.AddEdit.form.timeUnit.month'
                                    defaultMessage='Month(s)'
                                />
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>
        </>
    );
}
AddEditExecution.defaultProps = {
    limit: null,
    validating: false,
};
AddEditExecution.propTypes = {
    onChange: PropTypes.func.isRequired,
    updateGroup: PropTypes.func.isRequired,
    hasErrors: PropTypes.func.isRequired,
    limit: PropTypes.shape({}),
    validating: PropTypes.bool,
    match: PropTypes.shape({}).isRequired,
    history: PropTypes.shape({}).isRequired,
};

export default AddEditExecution;
